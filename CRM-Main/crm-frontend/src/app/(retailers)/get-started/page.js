import { redirect } from "next/navigation";

export default function GetStartedRedirectPage() {
  // Redirect legacy /get-started route to the new auth get-started page
  redirect("/auth/get-started");
}
