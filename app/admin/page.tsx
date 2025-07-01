import { Roboto } from "next/font/google";
import AdminPanel from "./(components)/AdminPanel";
import type { Metadata } from "next";
import {
  type ValidatedSession,
  withSessionValidatedPage,
} from "@/lib/server/auth/with-session-validated";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sokoverse Admin Panel",
  description: "Admin panel for Sokoban puzzle game",
};

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

function AdminPage({ session }: { session: ValidatedSession }) {
  if (![1, 20].includes(session.user.id)) {
    redirect("/");
  }

  return (
    <>
      <style>
        {`
      body {
        font-family: ${roboto.style.fontFamily}, sans-serif !important;
      }
    `}
      </style>
      <AdminPanel />;
    </>
  );
}

export default withSessionValidatedPage(AdminPage);
