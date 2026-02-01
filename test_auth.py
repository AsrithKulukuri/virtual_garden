import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Create client with ANON key (same as frontend)
supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Test credentials
email = "akulukur@student.gitam.edu"
password = "Asrith@89"

print("Testing Supabase Authentication...")
print(f"Email: {email}")
print(f"URL: {SUPABASE_URL}")
print("-" * 50)

try:
    # Try to sign up
    print("\n1. Attempting signup...")
    response = supabase.auth.sign_up({
        "email": email,
        "password": password
    })

    if response.user:
        print(f"✅ Signup successful!")
        print(f"   User ID: {response.user.id}")
        print(f"   Email: {response.user.email}")

        # Try to sign in immediately
        print("\n2. Attempting auto-login...")
        login_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })

        if login_response.session:
            print(f"✅ Login successful!")
            print(
                f"   Access Token: {login_response.session.access_token[:50]}...")
            print("\n🎉 Authentication is working! You can now use the app.")
        else:
            print("⚠️  Signup succeeded but auto-login failed")
    else:
        print("⚠️  Signup response has no user data")

except Exception as e:
    error_msg = str(e)
    if "rate limit" in error_msg.lower():
        print(f"❌ Rate limit error: {error_msg}")
        print("\n💡 Solution: Go to Supabase Dashboard → Authentication → Providers → Email")
        print("   and disable 'Confirm email' option")
    elif "already registered" in error_msg.lower():
        print(f"ℹ️  User already exists. Trying login instead...")
        try:
            login_response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            if login_response.session:
                print(f"✅ Login successful!")
                print(f"   User ID: {login_response.user.id}")
                print(
                    f"   Access Token: {login_response.session.access_token[:50]}...")
                print("\n🎉 You can now login with these credentials!")
        except Exception as login_error:
            print(f"❌ Login failed: {login_error}")
    else:
        print(f"❌ Error: {error_msg}")
