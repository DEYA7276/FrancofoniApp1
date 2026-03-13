import json
import os
import sys

TEAM_DIR = ".antigravity/team"

def init_team():
    os.makedirs(f"{TEAM_DIR}/mailbox", exist_ok=True)
    os.makedirs(f"{TEAM_DIR}/locks", exist_ok=True)
    tasks_path = f"{TEAM_DIR}/tasks.json"
    if not os.path.exists(tasks_path):
        with open(tasks_path, 'w') as f:
            json.dump({"tasks": [], "members": [
                "Tapisbot (Director)",
                "Arquitecto",
                "Especialista Frontend",
                "Especialista Backend",
                "Especialista DB",
                "Marketer",
                "Investigador",
                "Revisor"
            ]}, f, indent=2)
    if not os.path.exists(f"{TEAM_DIR}/broadcast.msg"):
        with open(f"{TEAM_DIR}/broadcast.msg", 'w', encoding='utf-8') as f: 
            f.write("")
    print("✓ Infraestructura 'Equipo Tapisbot' lista.")

def assign_task(title, assigned_to, deps=[]):
    path = f"{TEAM_DIR}/tasks.json"
    if not os.path.exists(path):
        init_team()
    with open(path, 'r+') as f:
        data = json.load(f)
        task = {
            "id": len(data["tasks"]) + 1,
            "title": title,
            "status": "PENDING",
            "plan_approved": False,
            "assigned_to": assigned_to,
            "dependencies": deps
        }
        data["tasks"].append(task)
        f.seek(0)
        json.dump(data, f, indent=2)
        f.truncate()
    print(f"✓ Tarea {task['id']} ({title}) asignada a {assigned_to}.")

def broadcast(sender, text):
    msg = {"de": sender, "tipo": "BROADCAST", "mensaje": text}
    with open(f"{TEAM_DIR}/broadcast.msg", 'a', encoding='utf-8') as f:
        f.write(json.dumps(msg, ensure_ascii=False) + "\n")
    print(f"✓ Mensaje global enviado por {sender}.")

def send_message(sender, receiver, text):
    msg = {"de": sender, "mensaje": text}
    os.makedirs(f"{TEAM_DIR}/mailbox", exist_ok=True)
    with open(f"{TEAM_DIR}/mailbox/{receiver}.msg", 'a', encoding='utf-8') as f:
        f.write(json.dumps(msg, ensure_ascii=False) + "\n")
    print(f"✓ Mensaje enviado a {receiver}.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "init": init_team()
