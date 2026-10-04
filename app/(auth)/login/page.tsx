"use client";
import { useRouter } from "next/navigation";
import { BrandMark, Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth/session";
export default function LoginPage() {
  const router = useRouter();
  return (
    <main className="login-page" id="main-content">
      <div className="login-story">
        <div className="brand">
          <BrandMark />
          <div>
            Mad Monkey<span>ANALYTICS</span>
          </div>
        </div>
        <div>
          <p className="eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</p>
          <h1>
            Every campus
            <br />
            has a pulse<span>.</span>
          </h1>
          <p>
            See what brings students together.
            <br />
            Build on what keeps them coming back.
          </p>
          <div className="login-spark">
            <Icon name="sparks" size={100} />
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          Mad Monkey AI · Internal analytics workspace
        </span>
      </div>
      <div className="login-form-wrap">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login();
            router.push("/overview");
          }}
        >
          <span className="eyebrow">WELCOME TO YOUR WORKSPACE</span>
          <h2>Good to have you here.</h2>
          <p>Your campus story is waiting.</p>
          <label htmlFor="identifier">Workspace ID</label>
          <Input
            id="identifier"
            name="identifier"
            autoComplete="off"
            placeholder="Any workspace ID"
          />
          <label htmlFor="password">Password</label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="off"
            placeholder="Any password"
          />
          <Button type="submit" className="w-full mt-6">
            Open dashboard <Icon name="arrow" size={15} />
          </Button>
          <div className="login-notice">
            <Icon name="info" size={17} />
            <span>
              Frontend preview. Any input works, including empty fields.
              Credentials are never stored or sent.
            </span>
          </div>
        </form>
      </div>
    </main>
  );
}
