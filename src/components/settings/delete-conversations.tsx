import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog.tsx";
import {useState} from "react";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {IconTrash} from "@tabler/icons-react";


export const DeleteConversations = () => {
  const [confirmInput, setConfirmInput] = useState("")

  const handleDeleteAllConversations = async () => {
    const {deleted} = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/conversations/all`, {
      method: "DELETE",
      credentials: "include",
    }).then(res => res.json())

    console.log("Number of conversatoin deleted: ", deleted)
  }


  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Delete all conversations</p>
        <p className="text-xs text-muted-foreground mt-0.5">Permanently removes all your chat history.</p>
      </div>
      <AlertDialog onOpenChange={(open) => {
        if (!open) setConfirmInput("")
      }}>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive">
            <IconTrash size={13}/>
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete all conversations?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will <span
                  className="font-semibold text-foreground">permanently delete every conversation</span> in
                  your account. This action <span
                  className="font-semibold text-foreground">cannot be undone</span> and your chat history will
                  be gone forever.
                </p>
                <div
                  className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  All messages, context, and history across all conversations will be lost.
                </div>
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs text-muted-foreground">
                    Type <span className="font-mono font-semibold text-foreground">CONFIRM</span> to continue.
                  </p>
                  <Input
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="Enter value"
                    className="h-8 text-sm"
                    autoComplete="off"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmInput("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={confirmInput !== "CONFIRM"}
              onClick={handleDeleteAllConversations}
            >
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
