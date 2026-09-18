import { requireChatGPTUser, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import StudioClient from "./studio-client";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await requireChatGPTUser("/studio");
  return <StudioClient displayName={friendlyName(user.displayName)} signOutPath={chatGPTSignOutPath("/")} />;
}

function friendlyName(value: string) {
  if (value.includes("@")) return value.split("@")[0];
  return value;
}
