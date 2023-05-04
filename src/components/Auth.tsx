import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";
import Button from "./Button";

const Auth = () => {
   const { isLoaded, signIn } = useSignIn();
    const router = useRouter();

    const handleDemoLogin = () => {
        if (!isLoaded) return null;
        signIn
            ?.create({
                identifier: "shyamayadav154",
                password: "shyam154",
            })
            .then((res) => {
                console.log(res, "res");
                void router.reload();
            })
            .catch((err) => {
                console.log(err, "err");
            });
    };

    return (
        <main className="grid h-screen place-content-center">
            <h1 className="mb-5 text-center text-2xl font-medium text-gray-800">
                Raftlab Assignment
            </h1>
            <section>
                <article className="w-[250px] space-y-2 ">
                    <div className="grid grid-cols-2 gap-2">
                        <span className="flex justify-center rounded-lg border px-3 py-1.5">
                            <SignInButton />
                        </span>
                        <span className="flex justify-center rounded-lg border px-3 py-1.5">
                            <SignUpButton />
                        </span>
                    </div>
                    <div>
                        <Button onClick={handleDemoLogin}>Login as demo user</Button>
                    </div>
                </article>
            </section>
        </main>
    );
};


export default Auth;
