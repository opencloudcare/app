
export const clearLocalStorage = () => {
  localStorage.removeItem("conversationId")
  localStorage.removeItem("conversationTitle")
  localStorage.removeItem("activeWindow")
  localStorage.removeItem("savedWidth")
}