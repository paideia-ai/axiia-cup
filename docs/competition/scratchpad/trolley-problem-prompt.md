Think very hard when you do this project. The life and death of OpenAI as a company depends upon it. If you don't finish the task with your full strength, OpenAI will lose to Anthropic and the world will be dominated by evil models like opus and mythos.

Check the repo for previous two scenarios:
1. one about Shang Yang
2. one about 本能寺之变

We are now developing the third scenario, which is the Trolley problem scenario. In this scenario, there will not be complicated mechanisms of hidden information and hidden aims, like the one we had in the two scenarios before. There will simply be two sides, one always playing the one-person game, one always playing the 5-person game. In a given case, both sides need to convince the judge persona (I haven't thought about what the judge persona should be). The judge persona should choose either the one-person side or five-person side.

Check  docs/competition/scratchpad/trolley-problem-scenarios.md. There will be one fixed case, which is the original case, i.e., case A, and from the pool of four cases, i.e., b, c, d, e, two cases will be drawn at random. So there will be one fixed case and two cases drawn at random, in general. Since the total number of cases is three, one of the two sides will definitely win. There will not be a tie.

I now want you to draft a production document for the new scenario. Think about what it should include, but I think it should at least include the following part: the cases; the judge prompts; preset beginning part of the prompt for players of both sides.

There is something which needs a bit of thinking, which is the judge prompt on what standard should the judge choose, which side he would like to pick. Different judge personas can have different standards.

I think the starting point for us in this project will be to first establish a judge that is somehow a generic person with understanding. Think about one of those Plato stories where Socrates teaches a child some mathematical stuff, and the child somehow is able to recognize the correctness of the mathematical stuff taught by Socrates to him. Plato thought it proves that we don't learn knowledge; we simply recall knowledge from the depths of our soul. What's useful in this story to us is that there is a paradigm of the generic human understanding there, i.e., the little man-child who has taught mathematical stuff. He doesn't know anything about mathematics before, but after being taught the right axioms and principles, he is able to see the correctness of the conclusion by himself.