import {useState} from "react";
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
import {authClient} from "@/lib/auth.ts";
import {Button} from "@/components/ui/button.tsx";
import {IconTrash} from "@tabler/icons-react";
import {Input} from "@/components/ui/input.tsx";
import {clearLocalStorage} from "@/components/auth/clear-local-storage.ts";
import {useNavigate} from "react-router";

export const DeleteAccount = () => {
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const navigate = useNavigate()

  const resetDeleteAccountState = () => {
    setDeleteConfirmInput("")
    setDeletePassword("")
    setDeleteError("")
    setDeleteLoading(false)
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteError("")
    clearLocalStorage()
    const { error } = await authClient.deleteUser({ password: deletePassword })
    if (error) {
      setDeleteError(error.message ?? "Incorrect password. Please try again.")
      setDeleteLoading(false)
      return
    }
    navigate("/sign-in")
  }
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Delete account</p>
        <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all data.</p>
      </div>
      <AlertDialog open={deleteAccountOpen} onOpenChange={(open) => {
        setDeleteAccountOpen(open)
        if (!open) resetDeleteAccountState()
      }}>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive">
            <IconTrash size={13}/>
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Permanently delete your account?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will <span className="font-semibold text-foreground">permanently and irreversibly delete your account</span>. Once deleted, there is <span className="font-semibold text-foreground">no way to recover</span> your account or any of your data.
                </p>
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 space-y-1 text-xs text-destructive">
                  <p className="font-semibold">The following will be permanently deleted:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-destructive/80">
                    <li>Your account and profile information</li>
                    <li>All conversations and chat history</li>
                    <li>All uploaded files and documents</li>
                    <li>All account settings and preferences</li>
                  </ul>
                </div>
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs text-muted-foreground">
                    Type <span className="font-mono font-semibold text-foreground">DELETE</span> to confirm.
                  </p>
                  <Input
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder="Type DELETE"
                    className="h-8 text-sm"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Enter your password to confirm.</p>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => { setDeletePassword(e.target.value); setDeleteError("") }}
                    placeholder="••••••••"
                    className="h-8 text-sm"
                    autoComplete="current-password"
                  />
                  {deleteError && (
                    <p className="text-xs text-destructive">{deleteError}</p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={resetDeleteAccountState}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteConfirmInput !== "DELETE" || !deletePassword || deleteLoading}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteAccount()
              }}
            >
              {deleteLoading ? "Deleting…" : "Delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
