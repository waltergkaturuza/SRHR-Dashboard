# 🚀 Git Setup and Push Guide

## Push Your SRHR Dashboard to GitHub

---

## Step 1: Initialize Git Repository

Open your terminal in the project directory and run:

```bash
# Navigate to your project directory
cd "C:\Users\Administrator\Documents\SRHR Dashboard"

# Initialize git repository (if not already initialized)
git init

# Set your Git username and email (if not already set)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## Step 2: Add Remote Repository

Add your GitHub repository as the remote:

```bash
git remote add origin https://github.com/waltergkaturuza/SRHR-Dashboard.git
```

If you've already added it, you can verify:

```bash
git remote -v
```

If the remote already exists but is incorrect, update it:

```bash
git remote set-url origin https://github.com/waltergkaturuza/SRHR-Dashboard.git
```

---

## Step 3: Create .gitignore (Already Created)

The `.gitignore` file has been created to exclude:
- `node_modules/`
- `venv/`
- `.env` (sensitive environment variables)
- `uploads/` (uploaded files)
- Database files
- Build artifacts

---

## Step 4: Stage All Files

```bash
# Add all files to staging
git add .

# Or add specific files/folders
git add app.py app_db.py
git add src/
git add database/
git add *.md
```

---

## Step 5: Create Initial Commit

```bash
git commit -m "Initial commit: SRHR Dashboard with PostgreSQL support

- Add complete React frontend with dark/light theme
- Add Flask backend with PostgreSQL integration
- Add database schema and seed data
- Add deployment files for Render.com
- Add comprehensive documentation
- Add dynamic year selection from database
- Add geospatial data upload functionality
- Add interactive map with Leaflet
- Add analytics dashboard with Recharts"
```

---

## Step 6: Push to GitHub

### If this is the first push:

```bash
# Push to main branch and set upstream
git push -u origin main
```

### If branch is named 'master':

```bash
# Check current branch
git branch

# If on master, either rename it or push to master
git branch -M main
git push -u origin main
```

---

## Step 7: Verify Push

1. Go to: https://github.com/waltergkaturuza/SRHR-Dashboard
2. Refresh the page
3. You should see all your files!

---

## Common Issues and Solutions

### Issue 1: Authentication Required

**If using HTTPS**, GitHub may ask for credentials:

**Option A: Personal Access Token (Recommended)**

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when prompted

**Option B: GitHub CLI**

```bash
# Install GitHub CLI from https://cli.github.com/
gh auth login
```

**Option C: SSH (More Secure)**

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add to GitHub: Settings → SSH Keys → New SSH Key
cat ~/.ssh/id_ed25519.pub

# Change remote to SSH
git remote set-url origin git@github.com:waltergkaturuza/SRHR-Dashboard.git

# Push
git push -u origin main
```

---

### Issue 2: Branch Name Mismatch

```bash
# Check current branch
git branch

# Rename to main if needed
git branch -M main

# Push
git push -u origin main
```

---

### Issue 3: Non-Empty Repository

If the GitHub repo already has files:

```bash
# Pull first
git pull origin main --allow-unrelated-histories

# Resolve any conflicts

# Then push
git push -u origin main
```

---

### Issue 4: Large Files

If you have files >100MB:

```bash
# Find large files
find . -size +100M

# Either:
# 1. Add to .gitignore
# 2. Use Git LFS

# Install Git LFS
git lfs install
git lfs track "*.zip"
git add .gitattributes
git commit -m "Add Git LFS"
```

---

## Complete Command Sequence

Here's the complete sequence to push everything:

```bash
# 1. Navigate to project
cd "C:\Users\Administrator\Documents\SRHR Dashboard"

# 2. Initialize (if needed)
git init

# 3. Add remote
git remote add origin https://github.com/waltergkaturuza/SRHR-Dashboard.git

# 4. Stage all files
git add .

# 5. Commit
git commit -m "Initial commit: Complete SRHR Dashboard"

# 6. Set main branch
git branch -M main

# 7. Push
git push -u origin main
```

---

## What Gets Pushed

### ✅ Included Files

**Frontend:**
- `src/` - All React components
- `index.html`
- `vite.config.js`
- `package.json`

**Backend:**
- `app.py` - Original backend
- `app_db.py` - PostgreSQL backend
- `requirements.txt`

**Database:**
- `database/schema.sql`
- `database/seed.sql`
- `database/models.py`

**Documentation:**
- All `*.md` files
- Setup guides
- Deployment guides

**Configuration:**
- `.gitignore`
- `.env.example` (template only)
- `Procfile`
- `render.yaml`
- `runtime.txt`

### ❌ Excluded Files (in .gitignore)

- `node_modules/` - Will be installed via npm
- `venv/` - Will be created locally
- `.env` - Contains secrets
- `uploads/` - User-uploaded files
- `dist/` - Build output
- Database files

---

## After Pushing

### Update README

Your repository should have a good README. You can update it:

```bash
# The README.md is already created
# If you want to update it, edit and push:
git add README.md
git commit -m "Update README"
git push
```

---

## Branch Strategy (Optional)

For future development:

```bash
# Create development branch
git checkout -b development

# Make changes...

# Commit changes
git add .
git commit -m "Add new feature"

# Push development branch
git push -u origin development

# Create pull request on GitHub
# Merge to main when ready
```

---

## Continuous Updates

For future changes:

```bash
# 1. Make your changes

# 2. Check status
git status

# 3. Stage changes
git add .

# 4. Commit with message
git commit -m "Describe your changes"

# 5. Push
git push

# That's it!
```

---

## Useful Git Commands

```bash
# Check status
git status

# View commit history
git log --oneline

# See what changed
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo all uncommitted changes
git checkout .

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main

# Delete branch
git branch -d branch-name

# Pull latest changes
git pull origin main

# View remotes
git remote -v

# Remove a file from git (but keep locally)
git rm --cached filename
```

---

## GitHub Repository Settings

After pushing, configure your repository:

1. **Add Description**
   - Go to repository page
   - Click "⚙️" icon
   - Add: "SRHR Geospatial Dashboard for Harare Health Decision-Making Platforms"

2. **Add Topics**
   - Click "⚙️" icon
   - Add tags: `dashboard`, `geospatial`, `postgresql`, `react`, `flask`, `srhr`, `postgis`

3. **Enable Issues**
   - Settings → Features → Issues ✓

4. **Add Wiki** (Optional)
   - Settings → Features → Wikis ✓

5. **Branch Protection** (Optional for collaboration)
   - Settings → Branches → Add rule
   - Protect `main` branch
   - Require pull request reviews

---

## Verify Your Push

Visit: https://github.com/waltergkaturuza/SRHR-Dashboard

You should see:
- ✅ All source code files
- ✅ Documentation files
- ✅ Configuration files
- ✅ Database schema
- ✅ README with project description
- ✅ Last commit message and date

---

## Clone Your Repository (Test)

Test that everything was pushed correctly:

```bash
# Navigate to a different directory
cd C:\temp

# Clone your repository
git clone https://github.com/waltergkaturuza/SRHR-Dashboard.git

# Check if all files are there
cd SRHR-Dashboard
ls

# If everything looks good, delete test clone
cd ..
rm -rf SRHR-Dashboard
```

---

## Next Steps

After successfully pushing:

1. ✅ **Verify** all files are on GitHub
2. ✅ **Update** repository description and topics
3. ✅ **Share** repository URL with your team
4. ✅ **Deploy** to Render.com using this repository
5. ✅ **Document** any team-specific setup instructions

---

## Success! 🎉

Your SRHR Dashboard is now on GitHub at:

**https://github.com/waltergkaturuza/SRHR-Dashboard**

Anyone can now:
- View your code
- Clone the repository
- Contribute (if you allow)
- Deploy to Render.com
- Track changes and issues

---

**Guide Version**: 1.0.0  
**Last Updated**: November 2025  
**Repository**: https://github.com/waltergkaturuza/SRHR-Dashboard.git

