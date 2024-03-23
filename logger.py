from flask import current_app as app
# import pandas as pd
from dateutil import parser
from json import dumps
from json import loads
from os import makedirs
from os.path import exists
from time import sleep
import database


# ["time_stamp", "component", "actor", "actor_id", "action_type", "action_value"]
def log(user_id, log_items):
    database_name = "logs.db"
    app_config = loads(open("config.json", "r").read())
    # Append underscore on all user IDs to conform to sqlite table naming rules
    user_id = f"_{user_id}"

    if not isinstance(log_items, list):
        log_items = [log_items]
    # Create table for user if needed
    if not database.table_exists(table_name=user_id, database_name=database_name):
        query_filepath = app_config["DATABASE_SETUP"]["logs"]["query_filepath"]
        query = open(query_filepath, "r").read().format(user_id)
        database.create(query, database_name=database_name)
    # Insert log items into database
    for item in log_items:
        # Edit log items before inserting into database
        item["time_stamp"] = parser.parse(item["time_stamp"]).strftime("%Y-%m-%d %H:%M:%S")
        if isinstance(item["action_value"], dict):
            item["action_value"] = dumps(item["action_value"])
        if item["actor"].lower() == "user":
            item["actor_id"] = user_id.lstrip("_")

        database.insert(columns=list(item.keys()), values=list(item.values()),
                        table_name=user_id, database_name=database_name)
