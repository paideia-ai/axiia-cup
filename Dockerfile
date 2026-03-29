FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir litellm fastapi 'uvicorn[standard]'

# Copy application
COPY server/ server/
COPY index.html .
COPY axiia_cup.db .

EXPOSE 8080

CMD ["python", "-m", "uvicorn", "server.api:app", "--host", "0.0.0.0", "--port", "8080"]
