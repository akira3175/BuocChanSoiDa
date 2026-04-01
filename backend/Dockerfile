FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# mysqlclient build deps (Python package compiles native extension)
RUN apt-get update -o Acquire::Retries=5 \
  && apt-get install -y --no-install-recommends -o Acquire::Retries=5 \
    gcc pkg-config default-libmysqlclient-dev \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

