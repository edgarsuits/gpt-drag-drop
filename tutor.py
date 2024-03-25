import re
import uuid
import database


def save(request):
    content = request['content']
    tutor_name = request['tutor_name']
    tutor_id = request["tutor_id"]


    # Create tutor ID if there is none
    if not tutor_id:
        tutor_id = database.create_entity_id("tutors")
        database.insert(columns=["id", "name", "content"], values=[tutor_id, tutor_name, content], table_name="tutors")
    else:
        database.update(entity_id=tutor_id, id_column="id", columns=["name", "content"],
                        values=[tutor_name, content], table_name="tutors")

    # Save log items


def get_tutor(tutor_id):
    return database.fetch(entity_id=tutor_id, id_column="id", columns="content", table_name="tutors")[0]


def reset_agent(tutor_id, agent_id):
    database.update(entity_id=tutor_id, id_column="id", columns="agent_id",
                    values=None, table_name="tutors")
    database.delete(entity_id=agent_id, id_column="id", table_name="agents")

