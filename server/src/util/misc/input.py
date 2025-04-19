import os

# Command history and command / path completion on Linux
if os.name == "posix":
    import readline
    from src.servers.admin_api.commands.commands_parser import get_command_list

    commands = get_command_list()

    def list_folder(path):
        if path.startswith(os.path.sep):
            # absolute path
            basedir = os.path.dirname(path)
            contents = os.listdir(basedir)
            # add back the parent
            contents = [os.path.join(basedir, d) for d in contents]
        else:
            # relative path
            contents = os.listdir(os.curdir)
        return contents

    # Dynamically complete commands
    def complete(text, state):
        line = readline.get_line_buffer()
        if line == text:
            results = [x for x in commands if x.startswith(text)] + [None]
        else:
            results = [x for x in list_folder(text) if x.startswith(text)] + [None]

        return results[state]

    readline.set_completer(complete)
    readline.parse_and_bind("tab: complete")
    readline.set_completer_delims(" \t\n`~!@#$%^&*()-=+[{]}\\|;:'\",<>?")
    inputFunction = input

# Command history and command / path completion on Windows
else:
    from prompt_toolkit import PromptSession
    from prompt_toolkit.auto_suggest import AutoSuggestFromHistory
    from prompt_toolkit.completion import NestedCompleter
    from prompt_toolkit.contrib.completers.system import SystemCompleter
    from prompt_toolkit.shortcuts import CompleteStyle

    from src.servers.admin_api.commands.commands_parser import get_command_list

    commands = get_command_list()

    # Complete system commands and paths
    systemCompleter = SystemCompleter()

    # Use a nested dict for each command to prevent arguments from being auto-completed before a command is entered and vice versa
    completion_dict = {}
    for c in commands:
        completion_dict[c] = systemCompleter
    nestedCompleter = NestedCompleter.from_nested_dict(completion_dict)

    session = PromptSession()


# User prompt
def prompt_user_for_command():
    from src.servers.admin_api.admin_server_init import np_server
    from src.servers.admin_api.models.nimplant_client_model import NimPlant
    from src.servers.admin_api.commands.commands_parser import handle_command

    np: NimPlant = np_server.get_active_nimplant()

    if os.name == "posix":
        command = input(f"Implant {np.id} $ > ")
    else:
        command = session.prompt(
            f"Implant {np.id} $ > ",
            completer=nestedCompleter,
            complete_style=CompleteStyle.READLINE_LIKE,
            auto_suggest=AutoSuggestFromHistory(),
        )

    handle_command(command)
