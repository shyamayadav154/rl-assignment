import { SignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

function Header() {
  const session = useUser();
  const username = session.user?.username;

  if (!username) return null;

  return (
    <header className="flex w-full items-center justify-between rounded p-4 shadow-sm">
      <div>
        logined as &nbsp;
        <Link className="underline" href={`/${username}`}>
          {username}
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link className="hover:underline" href={`/${username}`}>
          Profile
        </Link>
        <div className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-500/90">
          {!!session.isSignedIn && <SignOutButton />}
        </div>
      </div>
    </header>
  );
}

export default Header;
