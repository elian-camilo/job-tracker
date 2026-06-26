FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy dependencies first for better caching
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

# Copy source code
COPY . .

# Expose port and run uvicorn
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
