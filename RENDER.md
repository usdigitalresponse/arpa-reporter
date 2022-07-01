# Render Deployment

To set up a new pair of render instances for a state, follow the below steps!

### Create a new GitHub branch:

1. Create new branch: render-[state]
2. Open `render.yaml` for editing
3. Replace `arpa-reporter-web` with `arpa-reporter-[state]`
4. Replace `arpa-reporter-db` with `arpa-reporter-[state]-db` (in the TWO places it appears)
5. Save changes

### Create new Blueprint instance:

1. Log into Render.com and load the USDR dashboard
1. Click on the *Blueprints* tab
1. Select *New Blueprint Instance*
1. Set *Service Group Name* to: [state] USDR ARPA Reporter
1. Select your new branch to load render.yaml from
1. Set the appropriate environment variables (for now, copy from an existing instance)

### Once instances are set up:

1. Open the new web service
1. Click on the "shell" tab
1. Run `yarn db:init`

You're done! Open up the new site and log in.
