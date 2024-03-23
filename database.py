from datetime import datetime
from json import dumps
from os import makedirs
from pandas import DataFrame
import re
import sqlite3
from time import sleep
import uuid


def get_db_connection(database_name="database.db"):
    """
    Creates a database client
    @param database_name: Name of database
    @return: Sqlite3 Connection Client
    """
    con = sqlite3.connect(database_name)
    con.row_factory = sqlite3.Row
    return con


def create_entity_id(table_name, database_name="database.db"):
    """
    Creates a unique 32-character alphanumeric ID
    @param table_name: The name of the table to create an ID for
    @param database_name: Name of database
    @return:
    """
    eid = re.sub("-", "", str(uuid.uuid4()))
    # Check that generated ID does not match another ID
    while entity_exists(eid, table_name, database_name=database_name):
        eid = re.sub("-", "", str(uuid.uuid4()))
    return eid


def create(query, database_name="database.db"):
    queries = list_convert(query)
    for q in queries:
        execute_commit(q, database_name=database_name)


def delete(entity_id, id_column, table_name, database_name="database.db"):
    query = f"""
        DELETE FROM {table_name}
        WHERE {id_column} = '{entity_id}'
    """
    execute_commit(query, database_name=database_name)


def dump(table_name, database_name="database.db", filename=None, as_type="json"):
    filename = get_filename(filename, table_name, database_name)
    data = fetch_all(table_name, database_name, as_type)

    if as_type == "json":
        with open(filename, "w") as file:
            file.write(dumps(data, indent=2))
    else:
        data.to_csv(filename, index=False)


def dump_all(database_name="database.db", filename=None, as_type="json"):
    if not isinstance(database_name, list):
        database_name = [database_name]
    for db in database_name:
        tables = get_table_names(db)
        for t in tables:
            dump(t, db, filename, as_type)


def entity_exists(entity_id, table_name, database_name="database.db", id_column="id"):
    if not entity_id:
        return False
    con = get_db_connection(database_name)
    query = f"""
        SELECT {id_column} FROM {table_name} 
        WHERE {id_column} = '{entity_id}'
    """
    res = con.execute(query).fetchone()
    con.close()
    return False if res is None else True


def execute_commit(query, query_params=None, database_name="database.db"):

    while True:
        con = get_db_connection(database_name)
        try:
            if query_params:
                res = con.execute(query, query_params).fetchall()
            else:
                res = con.execute(query).fetchall()
            break
        except sqlite3.OperationalError as e:
            print(f"Cannot execute query due to error: {e}")
            con.close()
            sleep(0.1)
    con.commit()
    con.close()

    return res


def fetch(entity_id, id_column, columns, table_name, database_name="database.db", as_type="json"):
    columns = convert_columns(list_convert(columns), table_name, database_name)
    query = f"""
        SELECT {','.join(columns)} FROM {table_name}
        WHERE {id_column} = '{entity_id}'
    """
    return _fetch_data_helper(query, columns, database_name, as_type)


def fetch_all(table_name, database_name="database.db", as_type="json"):
    columns = convert_columns(list_convert(["*"]), table_name, database_name)
    query = f"SELECT {','.join(columns)} FROM {table_name}"
    return _fetch_data_helper(query, columns, database_name, as_type)


def _fetch_data_helper(query, columns, database_name, as_type):
    res = execute_commit(query, database_name=database_name)
    if res:
        data = [{columns[field_index]: row[field_index] for field_index in range(len(columns))} for row in res]
        if as_type != "json":
            data = DataFrame.from_records(data)
        return data
    return None


def insert(columns, values, table_name, database_name="database.db"):
    columns = convert_columns(list_convert(columns), table_name, database_name)
    values = list_convert(values)

    query = f"""
        INSERT INTO {table_name}
        ({','.join(columns)}) VALUES ({','.join([*'?'*len(values)])})
    """
    execute_commit(query, query_params=tuple(values), database_name=database_name)


def table_exists(table_name, database_name="database.db"):
    if not table_name:
        return False
    con = get_db_connection(database_name)
    query = f"""
        SELECT name FROM sqlite_master 
        WHERE type = 'table' AND name = '{table_name}'; 
    """
    res = con.execute(query).fetchone()
    con.close()
    return False if res is None else True


def update(entity_id, id_column, columns, values, table_name, database_name="database.db"):
    columns = convert_columns(list_convert(columns), table_name, database_name)
    values = list_convert(values)

    for i in range(len(columns)):
        if isinstance(values[i], str):
            query = f"""
                UPDATE {table_name}
                SET {columns[i]} = '{values[i]}'
                WHERE {id_column} = '{entity_id}'
            """
        else:
            if values[i] is None:
                values[i] = "null"
            query = f"""
                UPDATE {table_name}
                SET {columns[i]} = {values[i]}
                WHERE {id_column} = '{entity_id}'
            """

        execute_commit(query, database_name=database_name)


def setup(app_config):
    for item in app_config["DATABASE_SETUP"].values():
        if item["on_startup"]:
            query = open(item["query_filepath"], "r").read()
            create(query, item["database_name"])


###########
# HELPERS #
###########

def list_convert(x):
    if not isinstance(x, list):
        x = [x]
    return x


def convert_columns(columns, table_name, database_name):
    if columns[0] == "*":
        query = f"PRAGMA table_info({table_name});"
        res = execute_commit(query, database_name=database_name)
        # Row keys
        keys = res[0].keys()
        # Get index of name attribute
        name_index = keys.index("name")
        # Collect fields by index
        return [row[name_index] for row in res]
    return columns


def get_filename(filename, table_name, database_name):
    makedirs("data_dump/", exist_ok=True)

    if filename is None:
        filename = f'data_dump/{database_name.split(".")[0]}-{table_name}-dump-{datetime.now().strftime("%Y-%m-%d %H-%M-%S")}.txt'
    return filename


def get_table_names(database_name="database.db"):
    query = """
        SELECT * FROM sqlite_master where type='table';
    """
    res = execute_commit(query, database_name=database_name)
    return [r["name"] for r in res]
