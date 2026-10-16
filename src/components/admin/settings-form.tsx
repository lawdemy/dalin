"use client";

import { Camera, ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { setAvatar, setMomentsEnabled, updateDisplayName } from "@/app/admin/settings/actions";
import { signOut } from "@/app/login/actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { describedBy, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { Profile } from "@/lib/queries/settings";
import { UploadError, uploadAvatar } from "./upload-photo";

type SettingsFormProps = { momentsEnabled: boolean; profiles: Profile[] };

export function SettingsForm({ momentsEnabled, profiles }: SettingsFormProps) {
  const me = profiles.find((p) => p.isMe);
  const partner = profiles.find((p) => !p.isMe);

  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-10">
      <h1 className="text-title">Settings</h1>
      <PublicSiteSection momentsEnabled={momentsEnabled} />
      {me && <ProfileSection profile={me} />}
      {partner && (
        <section className="flex flex-col gap-3">
          <h2 className="text-section">{partner.displayName}</h2>
          <div className="flex items-center gap-4">
            <Avatar name={partner.displayName} image={partner.avatar} size="md" tone="b" />
            <p className="text-caption text-muted">
              Each of you edits your own name and photo when signed in.
            </p>
          </div>
        </section>
      )}
      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          className="-ml-3 text-danger-text hover:text-danger-text"
        >
          <LogOut aria-hidden className="size-4.5" strokeWidth={1.8} />
          Sign out
        </Button>
      </form>
    </div>
  );
}

function PublicSiteSection({ momentsEnabled }: { momentsEnabled: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(momentsEnabled);
  const [confirmingOff, setConfirmingOff] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  // Turning Moments off hides every public entry, so it asks first;
  // turning it back on is a single tap.
  function request(next: boolean) {
    setError(undefined);
    if (next) toggle(true);
    else setConfirmingOff(true);
  }

  function toggle(next: boolean) {
    setConfirmingOff(false);
    setOn(next);
    setError(undefined);
    startTransition(async () => {
      const res = await setMomentsEnabled(next);
      if (res.error) {
        setError(res.error);
        setOn(!next);
      }
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-section">Public site</h2>
      <div className="flex flex-col rounded-xl bg-linen px-4">
        <Switch
          label="Show Moments on the public site"
          checked={on}
          disabled={pending || confirmingOff}
          onCheckedChange={request}
        />
        {confirmingOff && (
          <div
            role="alertdialog"
            aria-label="Hide Moments?"
            className="mb-3 flex flex-col gap-2 rounded-xl bg-rose-tint px-4 py-3"
          >
            <p className="text-label text-danger-text">
              Hide Moments from visitors? The Moments page and its menu link disappear, and public
              entries and their photos are hidden until you switch it back on.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" size="sm" pending={pending} onClick={() => toggle(false)}>
                Hide Moments
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmingOff(false)}>
                Keep showing
              </Button>
            </div>
          </div>
        )}
        <p className="pb-3 text-caption text-muted">
          {on
            ? "Entries you mark Public appear under Moments and on the home page."
            : "Moments is hidden. Public entries and their photos aren't shown to visitors until you switch this back on."}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-caption text-danger-text">
          {error}
        </p>
      )}
      <p className="text-caption text-muted">
        Your names, welcome line and story are edited in the{" "}
        <Link href="/admin/about">About Us editor</Link>.{" "}
        <Link href="/" target="_blank" className="inline-flex items-center gap-1">
          View the site <ExternalLink aria-hidden className="size-3.5" strokeWidth={1.8} />
        </Link>
      </p>
    </section>
  );
}

function ProfileSection({ profile }: { profile: Profile }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.displayName);
  const [nameError, setNameError] = useState<string>();
  const [savedName, setSavedName] = useState(false);
  const [photoError, setPhotoError] = useState<string>();
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function saveName() {
    setNameError(undefined);
    setSavedName(false);
    startTransition(async () => {
      const res = await updateDisplayName(name);
      if (res.error) setNameError(res.error);
      else {
        setSavedName(true);
        router.refresh();
      }
    });
  }

  async function changePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError(undefined);
    setProgress(0);
    try {
      await uploadAvatar(file, setProgress);
      router.refresh();
    } catch (e) {
      setPhotoError(e instanceof UploadError ? e.message : "That photo couldn't be uploaded.");
    } finally {
      setProgress(null);
    }
  }

  function removePhoto() {
    setPhotoError(undefined);
    startTransition(async () => {
      const res = await setAvatar(null);
      if (res.error) setPhotoError(res.error);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-section">Your profile</h2>
      <div className="flex items-center gap-4">
        <Avatar name={name || profile.displayName} image={profile.avatar} size="lg" />
        <div className="flex flex-col gap-2">
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              void changePhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => input.current?.click()}
              pending={progress !== null}
            >
              {progress === null && <Camera aria-hidden className="size-4.5" strokeWidth={1.8} />}
              {progress !== null
                ? `Uploading ${progress}%`
                : profile.avatar
                  ? "Change photo"
                  : "Add photo"}
            </Button>
            {profile.avatar && progress === null && (
              <Button variant="ghost" size="sm" onClick={removePhoto} disabled={pending}>
                Remove
              </Button>
            )}
          </div>
          <p className="text-caption text-muted">Only the two of you see profile photos.</p>
        </div>
      </div>
      {photoError && (
        <p role="alert" className="text-caption text-danger-text">
          {photoError}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveName();
        }}
        className="flex flex-col gap-3"
      >
        <Field
          id="display-name"
          label="Display name"
          error={nameError}
          hint="Shown on your entries."
        >
          <Input
            id="display-name"
            value={name}
            maxLength={40}
            onChange={(e) => {
              setName(e.target.value);
              setSavedName(false);
            }}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={describedBy("display-name", { hint: true, error: nameError })}
          />
        </Field>
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            size="sm"
            pending={pending}
            disabled={name.trim() === profile.displayName}
          >
            Save name
          </Button>
          <span aria-live="polite" className="text-caption text-muted">
            {savedName ? "Saved." : ""}
          </span>
        </div>
      </form>
    </section>
  );
}
