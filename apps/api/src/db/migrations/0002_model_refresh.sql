UPDATE scenarios
SET judge_model = 'qwen3.5-397b-a17b'
WHERE judge_model = 'qwen3-32b';

UPDATE scenarios
SET judge_model = 'deepseek-v3.2'
WHERE judge_model IN ('minimax-m2.5', 'glm-5.1');

UPDATE submissions
SET model = 'qwen3.5-397b-a17b'
WHERE model = 'qwen3-32b';

UPDATE submissions
SET model = 'deepseek-v3.2'
WHERE model IN ('minimax-m2.5', 'glm-5.1');

UPDATE llm_calls
SET model = 'qwen3.5-397b-a17b'
WHERE model = 'qwen3-32b';

UPDATE llm_calls
SET model = 'deepseek-v3.2'
WHERE model IN ('minimax-m2.5', 'glm-5.1');
