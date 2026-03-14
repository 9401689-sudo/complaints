#Requires AutoHotkey v2.0

; Usage:
; 1. Open the complaint site and focus the text field.
; 2. Press Ctrl+Alt+O and select the saved .txt file.
; 3. Return focus to the target field within 3 seconds.
; 4. The script will type the text character by character.
;
; Hotkeys:
; Ctrl+Alt+O - choose a text file and type it into the active field
; Ctrl+Alt+S - stop typing immediately

global StopTyping := false

^!s::
{
    global StopTyping := true
    ToolTip("Autotyping stopped")
    SetTimer(() => ToolTip(), -1000)
}

^!o::
{
    global StopTyping := false

    filePath := FileSelect(1, A_ScriptDir, "Select complaint text", "Text Documents (*.txt)")
    if (!filePath) {
        return
    }

    text := FileRead(filePath, "UTF-8")
    if (Trim(text) = "") {
        MsgBox("Selected file is empty.")
        return
    }

    MsgBox("After closing this window, click the target text field. Typing will start in 3 seconds.`n`nHotkeys:`nCtrl+Alt+S - stop typing")
    Sleep(3000)

    for char in StrSplit(text) {
        if (StopTyping) {
            break
        }

        if (char = "`r") {
            continue
        }

        if (char = "`n") {
            Send("{Enter}")
        } else {
            SendText(char)
        }

        Sleep(12)
    }

    if (!StopTyping) {
        ToolTip("Autotyping complete")
        SetTimer(() => ToolTip(), -1200)
    }
}
