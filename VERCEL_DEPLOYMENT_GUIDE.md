# Vercel Deployment Guide for Secret Spin Vault

## Step-by-Step Manual Deployment Instructions

### Prerequisites
- GitHub account with access to the repository
- Vercel account (free tier available)
- Environment variables ready

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" and choose "Continue with GitHub"
3. Authorize Vercel to access your GitHub repositories

### Step 2: Import Project
1. In Vercel dashboard, click "New Project"
2. Find and select the `nora89n/secret-spin-vault` repository
3. Click "Import"

### Step 3: Configure Build Settings
1. **Framework Preset**: Select "Vite"
2. **Root Directory**: Leave as default (./)
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### Step 4: Set Environment Variables
In the Environment Variables section, add the following:

```
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=YOUR_WALLET_CONNECT_PROJECT_ID
NEXT_PUBLIC_INFURA_API_KEY=YOUR_INFURA_API_KEY
NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS=
```

**Important**: 
- Replace `YOUR_INFURA_KEY` with your actual Infura API key
- Replace `YOUR_WALLET_CONNECT_PROJECT_ID` with your WalletConnect project ID
- Replace `NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS` with the actual deployed contract address after deployment
- These are sensitive values, so they should NOT be committed to GitHub

### Step 5: Deploy
1. Click "Deploy" button
2. Wait for the build process to complete (usually 2-3 minutes)
3. Your app will be available at the provided Vercel URL

### Step 6: Configure Custom Domain (Optional)
1. In your project dashboard, go to "Settings" > "Domains"
2. Add your custom domain
3. Follow the DNS configuration instructions
4. Wait for SSL certificate to be issued

### Step 7: Set Up Automatic Deployments
1. Go to "Settings" > "Git"
2. Ensure "Automatic deployments" is enabled
3. Every push to the main branch will trigger a new deployment

### Step 8: Monitor and Update
1. Check the "Functions" tab for any serverless function logs
2. Monitor the "Analytics" tab for usage statistics
3. Update environment variables as needed in "Settings" > "Environment Variables"

## Post-Deployment Checklist

- [ ] Verify the app loads correctly
- [ ] Test wallet connection functionality
- [ ] Confirm all environment variables are set
- [ ] Check that the contract address is properly configured
- [ ] Test responsive design on mobile devices
- [ ] Verify all external links work correctly

## Troubleshooting

### Build Failures
- Check the build logs in Vercel dashboard
- Ensure all dependencies are properly installed
- Verify environment variables are correctly set

### Runtime Errors
- Check browser console for JavaScript errors
- Verify wallet connection is working
- Ensure contract address is valid

### Performance Issues
- Monitor bundle size in build logs
- Consider code splitting for large dependencies
- Optimize images and assets

## Security Notes

- Never commit sensitive environment variables to GitHub
- Use Vercel's environment variable system for sensitive data
- Regularly rotate API keys and tokens
- Monitor for any security vulnerabilities in dependencies

## Support

For issues with:
- **Vercel Platform**: Check [Vercel Documentation](https://vercel.com/docs)
- **Project Code**: Check the GitHub repository issues
- **Wallet Integration**: Refer to RainbowKit documentation

## Deployment URL
After successful deployment, your app will be available at:
`https://secret-spin-vault-[random-string].vercel.app`

You can also set up a custom domain for a more professional URL.

