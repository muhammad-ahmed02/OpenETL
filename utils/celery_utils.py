import time

from celery import Celery
from utils.database_utils import get_open_etl_document_connection_details
import utils.airflow_utils as pipeline

# Initialize Celery app with the broker
url = get_open_etl_document_connection_details(url=True)
app = Celery('openetl', broker='redis://localhost:6379/0')

# Route tasks to the default queue
app.conf.task_routes = {'*.tasks.*': {'queue': 'default'}}
app.conf.result_backend = f"db+{url}"

# Celery configuration settings (if needed, add more here)
app.conf.update(
    timezone='UTC',  # Set your preferred timezone
    enable_utc=True,  # Ensure UTC-based scheduling if timezone isn't specified
)

@app.task()
def run_pipeline(data, **kwargs):
    try:
        print("Running pipeline...")
        return True
        pipeline.run_pipeline()
    except Exception as e:
        print(f"Error occurred: {e}")
        return e

def get_task_details(task_id):
    return app.AsyncResult(task_id)

def retry(tries, delay):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for attempt in range(tries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    print(f"Attempt {attempt + 1} failed: {e}")
                    if attempt < tries - 1:
                        time.sleep(delay)
                    else:
                        raise
        return wrapper
    return decorator
