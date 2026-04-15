import { listScripts, listProjects } from "@/lib/db/queries";
import { ScriptsList } from "./scripts-list";

export const dynamic = "force-dynamic";

export default function ScriptsPage() {
  const allScripts = listScripts();
  const allProjects = listProjects();

  return <ScriptsList initialScripts={allScripts} initialProjects={allProjects} />;
}
