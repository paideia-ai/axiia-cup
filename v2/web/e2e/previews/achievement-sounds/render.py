#!/usr/bin/env python3
"""Render ten original achievement cues using only Python's standard library.

Run `python3 render.py` to reproduce the WAVs, manifest, and measurements.
Run `python3 render.py --check` to validate the generated files without writing.
All oscillators, excitation noise, reflections, and envelopes are synthesized.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import random
import struct
import wave

RATE = 44_100
CHANNELS = 2
ROOT = Path(__file__).resolve().parent
TAU = math.tau
TARGET_ACTIVE_RMS = 10 ** (-23.0 / 20)
PEAK_CEILING = 10 ** (-6.0 / 20)

SPECS = [
    {
        "id": "01",
        "name": "温润玻璃",
        "description": "两声玻璃轻响，尾音温和展开。",
        "duration": 1.35,
        "file": "01-warm-glass.wav",
        "character": "清透 · 温暖 · 双音",
    },
    {
        "id": "02",
        "name": "磁扣解锁",
        "description": "一缕电流聚拢，轻轻扣上确认。",
        "duration": 0.90,
        "file": "02-magnetic-unlock.wav",
        "character": "电子 · 克制 · 收束",
    },
    {
        "id": "03",
        "name": "铜币轻落",
        "description": "小小铜币落上木面，弹跳两下归于安静。",
        "duration": 1.08,
        "file": "03-copper-token.wav",
        "character": "实物感 · 铜木 · 轻巧",
    },
    {
        "id": "04",
        "name": "星尘微光",
        "description": "细碎光点缓缓散开，留下轻柔的空气感。",
        "duration": 1.70,
        "file": "04-stardust.wav",
        "character": "空灵 · 散点 · 绵长",
    },
    {
        "id": "05",
        "name": "毛毡木槌",
        "description": "三颗圆润木音，像轻轻点头。",
        "duration": 1.28,
        "file": "05-felt-mallet.wav",
        "character": "柔软 · 木质 · 亲近",
    },
    {
        "id": "06",
        "name": "像素跃迁",
        "description": "三步轻快向上，留一点复古游戏的机灵。",
        "duration": 0.78,
        "file": "06-pixel-rise.wav",
        "character": "数字 · 轻快 · 复古",
    },
    {
        "id": "07",
        "name": "微型凯旋",
        "description": "低声铺开，再以一束温暖和声落定。",
        "duration": 1.75,
        "file": "07-small-resolve.wav",
        "character": "温厚 · 和声 · 仪式感",
    },
    {
        "id": "08",
        "name": "弦上回声",
        "description": "三根轻拨的弦，依次留下细小回响。",
        "duration": 1.55,
        "file": "08-plucked-strings.wav",
        "character": "拨弦 · 自然 · 叙事",
    },
    {
        "id": "09",
        "name": "金色和弦",
        "description": "一个紧凑、明亮的和弦，干净地亮起。",
        "duration": 1.10,
        "file": "09-golden-chord.wav",
        "character": "明亮 · 齐奏 · 笃定",
    },
    {
        "id": "10",
        "name": "一粒确认",
        "description": "只留一颗很轻的提示，转瞬就收住。",
        "duration": 0.65,
        "file": "10-minimal-dot.wav",
        "character": "极简 · 单音 · 短促",
    },
]


def ease(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3 - 2 * value)


def envelope(t: float, duration: float, attack: float, decay: float) -> float:
    release = min(0.07, duration * 0.25)
    return (
        ease(t / attack)
        * math.exp(-t / decay)
        * ease((duration - t) / release)
    )


def voice(buffer, start, duration, sound, gain=1.0, pan=0.0):
    """Mix one local-time voice with equal-power stereo panning."""
    left_gain = math.cos((pan + 1) * math.pi / 4) * gain
    right_gain = math.sin((pan + 1) * math.pi / 4) * gain
    first = round(start * RATE)
    count = min(round(duration * RATE), len(buffer[0]) - first)
    for offset in range(max(0, count)):
        sample = sound(offset / RATE, offset)
        buffer[0][first + offset] += sample * left_gain
        buffer[1][first + offset] += sample * right_gain


def bell(buffer, start, frequency, gain, pan=0.0, decay=0.25, glass=False):
    duration = min(1.1, decay * 5)
    partials = (
        ((1, 1.0, 1.0), (2.756, 0.18, 0.35), (5.404, 0.025, 0.16))
        if glass
        else ((1, 1.0, 1.0), (2, 0.14, 0.55), (3, 0.025, 0.22))
    )

    def sound(t, _):
        onset = ease(t / 0.006)
        release = ease((duration - t) / 0.06)
        return onset * release * sum(
            strength * math.sin(TAU * frequency * ratio * t)
            * math.exp(-t / (decay * lifetime))
            for ratio, strength, lifetime in partials
        )

    voice(buffer, start, duration, sound, gain, pan)


def noise(buffer, start, duration, gain, seed, pan=0.0,
          attack=0.015, decay=0.1, low_cut=500, high_cut=3500):
    rng = random.Random(seed)
    high_state = 0.0
    low_state = 0.0
    high_alpha = 1 - math.exp(-TAU * high_cut / RATE)
    low_alpha = 1 - math.exp(-TAU * low_cut / RATE)

    def sound(t, _):
        nonlocal high_state, low_state
        high_state += high_alpha * (rng.uniform(-1, 1) - high_state)
        low_state += low_alpha * (high_state - low_state)
        return (high_state - low_state) * envelope(t, duration, attack, decay)

    voice(buffer, start, duration, sound, gain, pan)


def chirp(buffer, start, duration, first, last, speed, gain, pan=0.0,
          attack=0.007, decay=0.09):
    def sound(t, _):
        phase = TAU * (
            last * t + (first - last) * speed * (1 - math.exp(-t / speed))
        )
        return math.sin(phase) * envelope(t, duration, attack, decay)

    voice(buffer, start, duration, sound, gain, pan)


def fm(buffer, start, frequency, duration, gain, pan=0.0,
       index=0.8, ratio=2, decay=0.2):
    def sound(t, _):
        modulation = index * math.exp(-t / 0.075) * math.sin(
            TAU * frequency * ratio * t
        )
        return math.sin(TAU * frequency * t + modulation) * envelope(
            t, duration, 0.008, decay
        )

    voice(buffer, start, duration, sound, gain, pan)


def pad(buffer, start, frequency, duration, gain, pan=0.0, attack=0.13):
    def sound(t, _):
        wavelet = (
            math.sin(TAU * frequency * t)
            + 0.16 * math.sin(TAU * frequency * 2 * t + 0.3)
            + 0.07 * math.sin(TAU * frequency * 3 * t + 0.6)
        )
        return wavelet * envelope(t, duration, attack, 0.47)

    voice(buffer, start, duration, sound, gain, pan)


def pluck(buffer, start, frequency, duration, gain, pan, seed):
    """Damped Karplus–Strong string with a filtered deterministic excitation."""
    rng = random.Random(seed)
    length = max(2, round(RATE / frequency - 0.5))
    excitation = [rng.uniform(-1, 1) for _ in range(length)]
    mean = sum(excitation) / length
    ring = [
        (excitation[i] + excitation[(i - 1) % length]
         + excitation[(i - 2) % length]) / 3 - mean
        for i in range(length)
    ]
    previous = ring[-1]

    def sound(t, offset):
        nonlocal previous
        index = offset % length
        current = ring[index]
        ring[index] = 0.997 * (0.52 * current + 0.48 * previous)
        previous = current
        return current * ease(t / 0.007) * ease((duration - t) / 0.13)

    voice(buffer, start, duration, sound, gain, pan)


def reflect(buffer, amount=0.12, space=1.0):
    """A small stereo room made from damped, cross-channel early reflections."""
    dry = [channel.copy() for channel in buffer]
    taps = [(0.013, .36), (0.027, .27), (0.043, .21), (0.071, .14),
            (0.109, .1), (0.157, .065), (0.227, .035)]
    for channel in range(2):
        for delay, strength in taps:
            offset = round((delay * space + channel * 0.0037) * RATE)
            smoothed = 0.0
            for i in range(offset, len(buffer[channel])):
                source = (0.72 * dry[channel][i - offset]
                          + 0.28 * dry[1 - channel][i - offset])
                smoothed += 0.38 * (source - smoothed)
                buffer[channel][i] += smoothed * strength * amount


def synthesize(spec):
    frames = round(spec["duration"] * RATE)
    buffer = [[0.0] * frames, [0.0] * frames]
    key = spec["id"]
    if key == "01":
        bell(buffer, .020, 587.33, .70, -.20, .24, glass=True)
        bell(buffer, .205, 880, .60, .22, .32, glass=True)
        reflect(buffer, .25, 1.0)
    elif key == "02":
        noise(buffer, .020, .085, .40, 102, -.12, .004, .024, 1000, 4700)
        chirp(buffer, .025, .21, 710, 195, .027, .72, decay=.057)
        fm(buffer, .125, 440, .52, .35, -.12, 1.4, 1.0, .12)
        fm(buffer, .158, 880, .46, .24, .16, .5, 2.0, .11)
        reflect(buffer, .08, .65)
    elif key == "03":
        for t, strength, pan in [(.025, 1.0, -.15), (.186, .55, .10),
                                 (.292, .30, .20)]:
            chirp(buffer, t, .15, 370, 170, .014, .32 * strength,
                  pan, .002, .036)
            bell(buffer, t + .002, 1410, .24 * strength, pan, .105, glass=True)
            noise(buffer, t, .07, .22 * strength, round(t * 10000),
                  pan, .002, .02, 500, 3300)
        reflect(buffer, .13, .6)
    elif key == "04":
        noise(buffer, .025, 1.0, .20, 404, -.3, .14, .28, 1500, 5800)
        noise(buffer, .063, 1.1, .16, 405, .35, .15, .30, 1700, 5400)
        for t, frequency, pan, gain in [
            (.07, 783.99, -.5, .20), (.155, 1174.66, .40, .19),
            (.290, 1567.98, -.22, .17), (.415, 2349.32, .56, .11),
            (.505, 1174.66, .05, .09),
        ]:
            bell(buffer, t, frequency, gain, pan, .26, glass=True)
        reflect(buffer, .52, 1.6)
    elif key == "05":
        for t, frequency, pan, gain in [
            (.020, 349.23, -.20, .70), (.165, 440, 0, .60),
            (.335, 523.25, .22, .52),
        ]:
            fm(buffer, t, frequency, .70, gain, pan, .48, 3.97, .20)
        reflect(buffer, .12, .8)
    elif key == "06":
        for start, frequency, length, strength in [
            (.022, 659.25, .103, .52), (.120, 783.99, .103, .49),
            (.218, 1046.50, .31, .43),
        ]:
            def sound(t, _, f=frequency, d=length):
                triangular = sum(
                    (-1) ** ((n - 1) // 2)
                    * math.sin(TAU * f * n * t) / (n * n)
                    for n in (1, 3, 5, 7)
                )
                return triangular * envelope(t, d, .005, .13)
            voice(buffer, start, length, sound, strength, .0)
        reflect(buffer, .045, .4)
    elif key == "07":
        pad(buffer, .02, 130.81, 1.35, .20, 0, .12)
        for frequency, pan, gain in [(261.63, -.3, .25), (329.63, 0, .19),
                                     (392, .3, .22)]:
            pad(buffer, .12, frequency, 1.32, gain, pan, .15)
        bell(buffer, .275, 659.25, .20, .13, .27)
        reflect(buffer, .34, 1.5)
    elif key == "08":
        for start, frequency, gain, pan, seed in [
            (.022, 293.66, .73, -.28, 801),
            (.164, 440, .60, .08, 802),
            (.340, 587.33, .52, .30, 803),
        ]:
            pluck(buffer, start, frequency, 1.04, gain, pan, seed)
        reflect(buffer, .22, 1.1)
    elif key == "09":
        for start, frequency, pan, gain in [
            (.025, 523.25, -.32, .36), (.033, 659.25, .0, .30),
            (.041, 783.99, .32, .29),
        ]:
            fm(buffer, start, frequency, .83, gain, pan, .62, 2, .21)
        bell(buffer, .035, 1046.50, .065, 0, .12)
        reflect(buffer, .16, .8)
    elif key == "10":
        chirp(buffer, .019, .36, 1060, 880, .013, .65,
              attack=.007, decay=.075)
        noise(buffer, .019, .045, .075, 1010, 0, .003, .012, 1500, 4000)
        reflect(buffer, .04, .35)
    else:
        raise ValueError(f"Unknown cue: {key}")
    return finalize(buffer)


def active_rms(buffer):
    # Compare short-cue energy only in 20 ms windows above -45 dBFS.
    # This is a documented RMS proxy, not an LUFS measurement.
    window = round(.020 * RATE)
    energy = 0.0
    count = 0
    for start in range(0, len(buffer[0]), window):
        end = min(start + window, len(buffer[0]))
        value = sum(sample * sample for channel in buffer
                    for sample in channel[start:end])
        samples = (end - start) * CHANNELS
        if math.sqrt(value / samples) > 10 ** (-45 / 20):
            energy += value
            count += samples
    return math.sqrt(energy / count) if count else 0.0


def finalize(buffer):
    frames = len(buffer[0])
    # DC removal, a quiet 18 ms landing, and a smooth final 110 ms release.
    coefficient = math.exp(-TAU * 24 / RATE)
    for channel in buffer:
        last_input = last_output = 0.0
        for i, sample in enumerate(channel):
            output = coefficient * (last_output + sample - last_input)
            last_input, last_output = sample, output
            remaining = (frames - 1 - i) / RATE
            channel[i] = output * ease((remaining - .018) / .11)
    level = active_rms(buffer)
    peak = max(abs(sample) for channel in buffer for sample in channel)
    gain = min(TARGET_ACTIVE_RMS / level, PEAK_CEILING / peak)
    for channel in buffer:
        for i in range(len(channel)):
            channel[i] *= gain
    return buffer


def db(value):
    return round(20 * math.log10(value), 3) if value > 0 else None


def write_wave(path, buffer):
    encoded = bytearray(len(buffer[0]) * CHANNELS * 2)
    for frame in range(len(buffer[0])):
        for channel in range(CHANNELS):
            sample = round(buffer[channel][frame] * 32767)
            if not -32768 <= sample <= 32767:
                raise ValueError("Synthesis clipped before encoding")
            struct.pack_into('<h', encoded, (frame * CHANNELS + channel) * 2, sample)
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(CHANNELS)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(encoded)


def measure(spec):
    path = ROOT / spec["file"]
    with wave.open(str(path), 'rb') as source:
        assert source.getnchannels() == CHANNELS, path.name
        assert source.getsampwidth() == 2, path.name
        assert source.getframerate() == RATE, path.name
        assert source.getcomptype() == 'NONE', path.name
        count = source.getnframes()
        assert count == round(spec["duration"] * RATE), path.name
        raw = source.readframes(count)
    integers = [sample[0] for sample in struct.iter_unpack('<h', raw)]
    channels = [
        [sample / 32768 for sample in integers[channel::CHANNELS]]
        for channel in range(CHANNELS)
    ]
    rms = math.sqrt(sum(value * value for channel in channels for value in channel)
                    / len(integers))
    peak = max(abs(sample) for sample in integers) / 32768
    threshold = 10 ** (-60 / 20)
    audible_frames = [i for i in range(count)
                      if max(abs(channels[0][i]), abs(channels[1][i])) > threshold]
    tail = [sample for channel in channels for sample in channel[-round(.050 * RATE):]]
    tail_rms = math.sqrt(sum(value * value for value in tail) / len(tail))
    clipped = sum(sample in (-32768, 32767) for sample in integers)
    dc = sum(integers) / len(integers) / 32768
    last_sample = max(abs(channel[-1]) for channel in channels)
    record = {
        "id": spec["id"],
        "file": spec["file"],
        "duration_seconds": count / RATE,
        "sample_rate_hz": RATE,
        "channels": CHANNELS,
        "encoding": "PCM16 little-endian WAV",
        "peak_dbfs": db(peak),
        "rms_dbfs": db(rms),
        "active_rms_dbfs": db(active_rms(channels)),
        "leading_below_minus60_db_ms": round(audible_frames[0] / RATE * 1000, 2),
        "trailing_below_minus60_db_ms": round((count - 1 - audible_frames[-1]) / RATE * 1000, 2),
        "last_50ms_rms_dbfs": db(tail_rms),
        "last_frame_is_zero": last_sample == 0,
        "clipped_samples": clipped,
        "dc_offset": round(dc, 9),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }
    assert peak < .502 and clipped == 0, record
    assert -.5 < db(active_rms(channels)) + 23 < .5, record
    assert 0 < record["leading_below_minus60_db_ms"] < 90, record
    assert record["trailing_below_minus60_db_ms"] >= 18, record
    assert tail_rms < 10 ** (-60 / 20) and last_sample == 0, record
    assert abs(dc) < .001, record
    return record


def write_json(name, data):
    (ROOT / name).write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Validate only; do not write files.')
    args = parser.parse_args()
    if args.check:
        assert json.loads((ROOT / 'manifest.json').read_text()) == SPECS
    else:
        for spec in SPECS:
            write_wave(ROOT / spec["file"], synthesize(spec))
        write_json('manifest.json', SPECS)
    metrics = [measure(spec) for spec in SPECS]
    if args.check:
        assert json.loads((ROOT / 'metrics.json').read_text()) == metrics
    else:
        write_json('metrics.json', metrics)
    for item in metrics:
        print(f'{item["id"]} {item["duration_seconds"]:.2f}s '
              f'peak {item["peak_dbfs"]:.2f} dBFS '
              f'active RMS {item["active_rms_dbfs"]:.2f} dBFS '
              f'tail {item["last_50ms_rms_dbfs"]} dBFS '
              f'clipped {item["clipped_samples"]}')
    print('PASS: 10 PCM16 stereo WAVs, headers, levels, silence, tails, and hashes.')


if __name__ == '__main__':
    main()
