"""Seed an isolated preview with reference transcripts; the server grants achievements.

Run after seed-dev.ts, with the local Swift server stopped, then run the real
`axiia achievements backfill --apply` command. This never inserts unlocks.
"""
import json
import sqlite3
import sys
import time
from pathlib import Path

path = Path(sys.argv[1]).resolve()
if 'achievement-preview' not in str(path.parent) or not path.is_file():
    raise SystemExit('Expected an existing isolated achievement-preview database.')
fixtures = Path(__file__).resolve().parents[1] / 'src/testing'
db = sqlite3.connect(path)
db.row_factory = sqlite3.Row
db.execute('PRAGMA foreign_keys=ON')
if db.execute('SELECT count(*) FROM matches').fetchone()[0]:
    raise SystemExit('Refusing to seed a nonempty match database.')
users = [db.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone()[0]
         for email in ('jiangpan@axiia.test', 'tieyan@axiia.test', 'qiufen@axiia.test', 'wuming@axiia.test')]
now = int(time.time())
# Fixture chronology must precede the match and revision evidence it represents.
db.execute('UPDATE agent_versions SET created_at=?', (now - 86400,))
db.execute('UPDATE users SET created_at=?', (now - 86400,))

def version(user, scenario, side):
    return db.execute('''SELECT v.id FROM agent_versions v JOIN agents a ON a.id=v.agent_id
        WHERE a.user_id=? AND a.scenario_id=? AND a.side=? ORDER BY v.id DESC LIMIT 1''',
        (user, scenario, side)).fetchone()[0]

def save_match(raw, own_side, index, reward=False):
    scenario = raw['summary']['scenarioID']
    winner = raw['summary']['winner']
    slot = db.execute('SELECT script_sha,params FROM scenario_slots WHERE id=?', (scenario,)).fetchone()
    sides = {'a': users[0] if own_side == 'a' else users[1 + index % 3],
             'b': users[0] if own_side == 'b' else users[1 + index % 3]}
    ended = now - 7200 + index * 300
    turns = raw['turns']
    cursor = db.execute('''INSERT INTO matches
        (scenario_id,kind,a_version_id,b_version_id,current_turn,scored,winner,score_a,score_b,
         reasoning,script_sha,params,initiator_user_id,created_at,dispatched_at,finished_at)
        VALUES (?,?,?,?,?,1,?,?,?,?,?,?,?,?,?,?)''',
        (scenario, 'pvp', version(sides['a'], scenario, 'a'), version(sides['b'], scenario, 'b'),
         raw.get('currentTurn', len(turns)), winner, raw.get('scoreA', 1), raw.get('scoreB', 0),
         raw.get('reasoning', '本地预览测试对局'), slot['script_sha'], slot['params'], users[0],
         ended - 240, ended - 230, ended))
    match_id = cursor.lastrowid
    dispatch = db.execute('INSERT INTO dispatches(user_id,match_id,kind,created_at) VALUES (?,?,?,?)',
                         (users[0], match_id, 'pvp', ended - 240)).lastrowid
    for turn in turns:
        text = json.dumps(turn['event'], ensure_ascii=False) if turn.get('event') else turn.get('finalText', '')
        db.execute('''INSERT INTO turns(match_id,seq,channel,kind,speaker,final_text,reasoning)
            VALUES (?,?,?,?,?,?,?)''', (match_id, turn['seq'], turn['channel'], turn['kind'],
                                     turn['speaker'], text, turn.get('reasoning')))
    for verdict in raw.get('verdicts', []):
        output = verdict['output']
        db.execute('''INSERT INTO verdicts(match_id,key,after_seq,output,model,created_at)
            VALUES (?,?,?,?,?,?)''', (match_id, verdict['key'], verdict['afterSeq'],
                output if isinstance(output,str) else json.dumps(output,ensure_ascii=False),
                verdict.get('model','preview'), ended))
    if reward:
        assert winner == own_side
        db.execute('''INSERT INTO reward_charges
            (id,user_id,match_id,kind,points,win_points,scenario_id,side,created_at)
            VALUES (?,?,?,?,?,?,?,?,?)''', (dispatch,users[0],match_id,'pvp',100,75,scenario,own_side,ended-240))
        db.execute('INSERT INTO reward_entries(id,user_id,points,created_at) VALUES (?,?,?,?)',
                   (f'debit:{dispatch}',users[0],-100,ended-240))
    return match_id

seed_users = users[:]
claimable = {}
with db:
    # Keep the user's account unclaimed while the browser verification uses tieyan.
    for primary in range(2):
        users = seed_users[primary:] + seed_users[:primary]
        court = json.loads((fixtures/'reference-match-144.json').read_text())
        own = court['summary']['winner']
        save_match(court, 'b' if own == 'a' else 'a', 0)
        claimable[users[0]] = save_match(court, own, 1, reward=True)
        for index, number in enumerate((120,122,123,145), 2):
            raw = json.loads((fixtures/f'reference-match-{number}.json').read_text())
            save_match(raw, raw['summary']['winner'], index)
        # A complete structured 3:0 verdict also exercises the gold achievement.
        gold = {
            'summary': {'scenarioID':'trolley-problem','winner':'a'}, 'scoreA':3,'scoreB':0,
            'currentTurn':3, 'reasoning':'本地预览测试：三个案件均支持一人侧。',
            'turns': [
                {'seq':0,'channel':'verdict','kind':'event','speaker':'event',
                 'event':{'type':'verdict','actor':'judge','rulings':{'A':'一人侧','B':'一人侧','C':'一人侧'},'winner':'a'}},
                {'seq':1,'channel':'verdict','kind':'event','speaker':'event',
                 'event':{'type':'score','cases':['A','B','C'],'scoreA':3,'scoreB':0,'winner':'a'}}],
            'verdicts':[{'key':'final','afterSeq':0,'model':'preview','output':
                        {'A':'一人侧','B':'一人侧','C':'一人侧','speech':'三个案件，我都支持一人侧。'}}]}
        save_match(gold,'a',6)
print(json.dumps({'email':'jiangpan@axiia.test','password':'seedpw-123456',
                  'claimableMatchID':claimable[seed_users[0]],
                  'verificationEmail':'tieyan@axiia.test','matches':14},ensure_ascii=False))
