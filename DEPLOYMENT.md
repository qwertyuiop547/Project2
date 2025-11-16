# Barangay Complaint System - Deployment Guide

## Deploy sa Render

### Pre-requisites
1. I-push ang code sa GitHub repository
2. Gumawa ng account sa [Render.com](https://render.com)

### Deployment Steps

1. **Create New Web Service**
   - Login sa Render Dashboard
   - Click "New +" > "Web Service"
   - I-connect ang GitHub repository mo

2. **Configure Web Service**
   - **Name**: `barangay-complaint` (o kahit ano)
   - **Region**: Singapore (para mas mabilis sa Pilipinas)
   - **Branch**: `main` (o master)
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn core.wsgi:application`

3. **Environment Variables** (Advanced > Environment Variables)
   Idagdag ang mga sumusunod:
   
   ```
   PYTHON_VERSION=3.11.0
   SECRET_KEY=<generate random string>
   DEBUG=False
   ALLOWED_HOSTS=.onrender.com
   DATABASE_URL=<automatic pag may PostgreSQL>
   OPENAI_API_KEY=<optional - kung may AI features>
   WEATHER_API_KEY=<optional>
   ```

4. **Create PostgreSQL Database** (Optional pero recommended)
   - Click "New +" > "PostgreSQL"
   - I-link sa web service
   - Auto-magdadagdag ng DATABASE_URL env var

5. **Deploy!**
   - Click "Create Web Service"
   - Maghintay ng 5-10 minutes para sa first deployment
   - Ang URL mo ay magiging: `https://barangay-complaint.onrender.com`

### Important Notes

- **Free tier**: Makakatulog ang service pag walang traffic (50 hours per month)
- **Paid tier** ($7/month): 24/7 uptime, mas mabilis
- **Static files**: Ginagamit natin ang WhiteNoise para sa CSS/JS
- **Media files**: I-setup ang cloud storage (Cloudinary/AWS S3) para sa uploaded files

### Post-Deployment

1. **Create superuser** (sa Render Shell):
   ```bash
   python manage.py createsuperuser
   ```

2. **Access admin panel**:
   ```
   https://your-app.onrender.com/admin/
   ```

### Troubleshooting

Pag may error, check ang logs:
- Render Dashboard > Your Service > Logs tab

Common issues:
- Database not connected: I-check ang DATABASE_URL
- Static files 404: Run `python manage.py collectstatic`
- Secret key error: I-check ang SECRET_KEY env var
