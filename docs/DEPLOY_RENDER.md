# Deploying to Render
This guide explains how to deploy the **BuocChanSoiDa** project to [Render](https://render.com) using the Infrastructure-as-Code (Blueprint) approach.
## 1. Prerequisites
- A [Render](https://render.com) account.
- Your project pushed to a **GitHub** or **GitLab** repository.
- A Cloudinary account (for image storage).
- A PayPal Developer account (for payments).
## 2. Deployment Steps
### Step 1: Connect your Repository
1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository.
### Step 2: Configure the Blueprint
Render will automatically detect the `render.yaml` file in your root directory.
1. Give your Blueprint a name (e.g., `buocchansoida-stack`).
2. Render will show a list of services to be created:
   - **PostgreSQL Database**: `buocchansoida-db`
   - **Web Service (Backend)**: `buocchansoida-backend`
   - **Web Service (Frontend)**: `buocchansoida-frontend`
### Step 3: Fill in Secret Variables
During the setup, Render will prompt you for variables marked with `sync: false`. You **must** provide these values manually:
| Variable | Description | Example Value |
|----------|-------------|---------------|
| `CLOUDINARY_URL` | Your Cloudinary connection string | `cloudinary://api_key:api_secret@cloud_name` |
| `PAYPAL_CLIENT_ID` | Your PayPal Sandbox/Live Client ID | `Ad3Dq3bgQgni...` |
| `PAYPAL_SECRET` | Your PayPal Sandbox/Live Secret | `EJJBJNuPsNMV...` |
> [!TIP]
> You can find these keys in your Cloudinary Dashboard and PayPal Developer Portal.
### Step 4: Deploy
Click **Apply**. Render will now:
1. Provision the PostgreSQL database.
2. Build and deploy the Django backend (it will automatically run migrations).
3. Build and deploy the Vite frontend.
## 3. Post-Deployment Configuration
### Update Allowed Hosts & Origins
In `render.yaml`, the `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS` are pre-configured for Render's default subdomains. If you use a **Custom Domain**, you must update these values in the Render Dashboard (Environment tab of the backend service).
### Accessing the App
- **Backend URL**: `https://buocchansoida-backend.onrender.com`
- **Frontend URL**: `https://buocchansoida.netlify.app` (or your Render frontend URL)
- **Django Admin**: `https://buocchansoida-backend.onrender.com/admin`
## 4. Local Development vs. Production
To run the project locally while mimicking the production environment:
1. Create a `.env` file in the root directory.
2. Copy the keys from `.env.example`.
3. Add your sensitive keys (`CLOUDINARY_URL`, `PAYPAL_SECRET`, etc.) to this `.env` file.
4. **Never** commit the `.env` file to git.
## 5. Troubleshooting
- **Database Errors**: Check the backend logs in Render. Ensure the `DATABASE_URL` is correctly injected by Render.
- **Frontend API Connection**: If the frontend cannot reach the backend, verify that `VITE_API_URL` in the frontend environment variables points to the correct backend URL.
- **Static Files**: If CSS/Images are missing in the Django Admin, ensure `python manage.py collectstatic` ran successfully during the build command.
## 6. Migrating Data from Local to Render (No Shell Method)
Instead of using the Render Shell, you can connect to the Render database directly from your local machine to upload your data.
### Step 1: Export Local Data
On your local machine, export your data to a JSON file:
```bash
python manage.py dumpdata --exclude auth.permission --exclude contenttypes > data.json
```
### Step 2: Get External Connection String
1. Open the [Render Dashboard](https://dashboard.render.com).
2. Select your **PostgreSQL Database** (`buocchansoida-db`).
3. Click on the **Connect** button and then the **External Connection** tab.
4. Copy the **External Connection String**.
### Step 3: Configure Local Access
In the database settings on Render, go to **Access Control** and ensure your current IP address is allowed to connect (Click **Add Current IP Address**).
### Step 4: Load Data from Local
On your local machine, run the following commands (replace the URL with your copied string):
**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="your_external_connection_string_here"
python manage.py loaddata data.json
```
**macOS/Linux:**
```bash
export DATABASE_URL="your_external_connection_string_here"
python manage.py loaddata data.json
```
> [!TIP]
> This method is safer and faster because you don't need to commit your `data.json` to GitHub.
> [!CAUTION]
> If your project uses **Signals** (e.g., to automatically upload to Cloudinary or generate TTS files), `loaddata` might trigger these signals for every record. Ensure you have logic to handle this or disable signals during the import if necessary.
