# 🚀 Render Deployment Guide - Barangay Complaint System

## ⚡ Quick Start (5 Steps)

### Step 1: Create PostgreSQL Database
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in:
   - **Name**: `barangay-complaint-db`
   - **Database**: `barangay_db`
   - **User**: `barangay_user`
   - **Region**: **Singapore** (closest to Philippines)
   - **Plan**: **Free**
4. Click **"Create Database"**
5. Wait 2-3 minutes for database creation
6. **COPY** the **"Internal Database URL"** (starts with `postgres://`)

---

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Click **"Connect a repository"**
3. Select: `qwertyuiop547/Project2`
4. Fill in:
   - **Name**: `barangay-complaint`
   - **Region**: **Singapore**
   - **Branch**: `main`
   - **Root Directory**: (leave blank)
   - **Runtime**: **Python 3**
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn core.wsgi:application`
   - **Plan**: **Free**

---

### Step 3: Add Environment Variables
Scroll down to **"Environment Variables"** and add these:

| Key | Value |
|-----|-------|
| `SECRET_KEY` | `FQjJjeZEX_RS6a9x4wNamlL58_FoPsXAWHmzFu5XOzJpt_c0V_c-OOa8bgTtfEzvT8A` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `.onrender.com` |
| `DATABASE_URL` | (paste Internal Database URL from Step 1) |
| `PYTHON_VERSION` | `3.11.0` |

**Optional (if you have):**
- `OPENAI_API_KEY` - for AI Virtual Captain feature
- `WEATHER_API_KEY` - for weather widget

---

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Watch the logs - you should see:
   ```
   ✓ Building...
   ✓ Running migrations...
   ✓ Collecting static files...
   ✓ Starting server...
   ```

---

### Step 5: Create Superuser
After successful deployment:

1. Go to your Web Service dashboard
2. Click **"Shell"** tab (left sidebar)
3. Run this command:
   ```bash
   python manage.py createsuperuser
   ```
4. Enter:
   - Username: `admin`
   - Email: your email
   - Password: (min 8 characters)

---

## 🎉 Done!

Your site is live at: **https://barangay-complaint.onrender.com**

- **Public Site**: https://barangay-complaint.onrender.com
- **Admin Panel**: https://barangay-complaint.onrender.com/admin/

---

## 📊 Free Tier Limits

- **Web Service**: 
  - ✅ FREE (with limitations)
  - 🕒 Sleeps after 15 minutes of inactivity
  - ⏱️ Takes 30-60 seconds to wake up
  - 💾 750 hours/month (enough for testing)

- **PostgreSQL Database**:
  - ✅ FREE
  - 💾 256 MB storage
  - ⚠️ Expires after 90 days (renew for free)

---

## 🔧 Troubleshooting

### Problem: "no such table" error
**Solution**: Database migrations didn't run
```bash
# In Render Shell:
python manage.py migrate
```

### Problem: Static files (CSS/JS) not loading
**Solution**: Collect static files again
```bash
# In Render Shell:
python manage.py collectstatic --noinput
```

### Problem: Site is slow/not loading
**Reason**: Free tier sleeps after inactivity
- First visit after sleep takes 30-60 seconds
- Upgrade to paid plan ($7/month) for 24/7 uptime

### Problem: Database full
**Solution**: Free tier has 256MB limit
- Upgrade database to Starter plan ($7/month) for 1GB

---

## 🔄 Update/Redeploy

When you update your code:

1. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```

2. **Render auto-deploys** (if enabled), or:
   - Go to Render Dashboard
   - Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 📝 Important Notes

1. **Database Persistence**: Data is saved in PostgreSQL (persistent)
2. **Media Files**: Uploaded files (photos, attachments) are NOT persistent on free tier
   - Consider using Cloudinary or AWS S3 for production
3. **Environment Variables**: Never commit .env file to GitHub
4. **Logs**: Check logs in Render Dashboard if something goes wrong

---

## 🎯 Next Steps

1. ✅ Create admin account
2. ✅ Create test residents accounts
3. ✅ Test all features (complaints, announcements, gallery)
4. ✅ Share the link with users!

---

## 💰 Upgrade Options (Optional)

**For Production Use:**

- **Web Service Starter**: $7/month
  - 24/7 uptime (no sleep)
  - Faster performance
  - Custom domain support

- **PostgreSQL Starter**: $7/month
  - 1 GB storage
  - No expiration
  - Better performance

**Total**: $14/month for production-ready hosting

---

## 🆘 Need Help?

- Check Render logs: Dashboard → Logs tab
- Check deployment status: Dashboard → Events tab
- Contact support: https://render.com/support

---

**Good luck! Your Barangay Complaint System is ready to go live! 🎊**
