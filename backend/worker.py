from rq import Worker

from queue_conn import redis_conn, job_queue


if __name__ == "__main__":
    worker = Worker([job_queue], connection=redis_conn)
    worker.work(with_scheduler=False)
