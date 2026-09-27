# Testing launch setup

## Hosting

The GitHub Pages workflow has been removed. Vercel is the frontend host; push the changes to the branch connected to Vercel. Removing the workflow does not unpublish an already-existing GitHub Pages site.

## Demo AI usage

No app-imposed daily AI-call cap is enabled or included in this demo build. The proposed cap was removed before deployment. No usage-cap SQL migration is needed. Existing per-request body-size, output-token and timeout limits remain in place.

## QR code

The sharing QR encodes only `https://padtalk.vercel.app/`, with no credentials or tracking parameters.

Files: `public/padtalk-qr.png` and `public/padtalk-qr.svg`. PNG is convenient for group chats; SVG is suitable for print. After Vercel deploys the files, the PNG is also available at `https://padtalk.vercel.app/padtalk-qr.png`.

## Deployment status

The QR files and Pages-workflow removal are local repository changes until pushed. No provider billing limits or remote Supabase usage settings were changed by this task.
