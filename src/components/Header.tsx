import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

function Header({ userName }: { userName: string | null }) {
    if (userName == null) return null;

    return (
        <header className="flex w-full items-center justify-between rounded p-4 shadow-sm">
            <div>
                Logined as &nbsp;
                <Link className="underline" href={`/${userName}`}>
                    {userName}
                </Link>
            </div>
            <div className="flex items-center gap-4">
                <Link className="hover:underline" href={`/${userName}`}>
                    Profile
                </Link>
                <div className="rounded bg-red-500 px-3 py-1 text-white hover:bg-red-500/90">
                    <SignOutButton />
                </div>
            </div>
        </header>
    );
}

export default Header;
