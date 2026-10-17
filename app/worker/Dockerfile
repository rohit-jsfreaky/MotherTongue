# MotherTongue worker: no GPU. Calls AMD Token Factory and runs FFmpeg on CPU.
FROM python:3.12-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fontconfig \
 && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.10.0 /uv /usr/local/bin/uv

# Hugging Face Spaces run as uid 1000.
RUN useradd -m -u 1000 app
USER app
WORKDIR /home/app/worker

COPY --chown=app pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev --no-install-project
COPY --chown=app src ./src
COPY --chown=app fonts ./fonts
COPY --chown=app templates ./templates
RUN uv sync --frozen --no-dev

ENV PORT=7860 WORKER_TMP=/tmp FFMPEG_THREADS=2 PYTHONUNBUFFERED=1
EXPOSE 7860
CMD ["uv", "run", "--no-sync", "mothertongue-worker", "serve"]
