import {Textarea} from "@/components/ui/textarea.tsx";
import {Separator} from "@/components/ui/separator.tsx";

const MAX_TEXTAREA_HEIGHT = 256;
const MIN_TEXTAREA_HEIGHT = 64;

export const ChatInterface = () => {
  const chatTitle = "First Chat";
  return (
    <div className="bg-sidebar-accent w-full h-full rounded-l-2xl p-3">
      <div className="bg-white rounded-xl flex-1 flex flex-col h-full p-3 gap-2">
        <h1 className="font-medium">{chatTitle}</h1>
        <Separator />
      </div>
      <div className="absolute bottom-0 w-full left-0 p-3">
        <Textarea style={{maxHeight: MAX_TEXTAREA_HEIGHT, minHeight: MIN_TEXTAREA_HEIGHT}}
                  className="bg-white rounded-xl" placeholder="Chat with our agent"/>
      </div>

    </div>
  );
};
