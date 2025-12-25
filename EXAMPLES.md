# Claude Browser Agent - Example Commands

## Basic Navigation

```
"Go to google.com"
```

```
"Navigate to https://amazon.com"
```

```
"Scroll down 500 pixels"
```

```
"Scroll to the bottom of the page"
```

---

## Form Filling

```
"Fill in the search box with 'laptop computers'"
```

```
"Type 'john.doe@email.com' into the email field"
```

```
"Fill out the contact form with:
Name: John Doe
Email: john@example.com
Phone: 555-1234
Message: I'm interested in your services"
```

---

## Clicking

```
"Click the 'Sign In' button"
```

```
"Click the first search result"
```

```
"Click on the shopping cart icon"
```

```
"Find and click the 'Add to Cart' button"
```

---

## File Uploads

```
"Upload my resume from C:\\Users\\erich\\Documents\\resume.pdf"
```

```
"Upload the file C:\\Users\\erich\\Downloads\\photo.jpg to the file input on this page"
```

```
"Find the file upload button and upload C:\\Users\\erich\\Desktop\\data.csv"
```

---

## Multi-Step Tasks

```
"Fill in the login form with username 'testuser' and password 'testpass', then click login"
```

```
"Search for 'mechanical keyboard', click the first result, and scroll to the reviews section"
```

```
"Go to the pricing page, scroll down to find the pro plan, and click the signup button"
```

---

## Real Estate Automation (Your Use Case!)

```
"Fill out this property listing form with data from C:\\Users\\erich\\property-data.txt"
```

```
"Upload property photos from C:\\Users\\erich\\Downloads\\ - upload all JPG files that start with 'house'"
```

```
"Navigate through the multi-page listing form:
Page 1: Address: 123 Ocean Dr, Miami Beach, FL 33139
Page 2: Price: $750,000, Beds: 3, Baths: 2
Page 3: Upload photos from Downloads folder"
```

---

## Data Extraction

```
"Find all product prices on this page and tell me the cheapest one"
```

```
"Extract all email addresses from this page"
```

```
"Find all links to PDF files and list them"
```

---

## Advanced Examples

### Job Application

```
"Fill out this job application:
- Name: John Doe
- Email: john@example.com
- Phone: 555-1234
- Upload resume from C:\\Users\\erich\\Documents\\JohnDoe_Resume.pdf
- Upload cover letter from C:\\Users\\erich\\Documents\\CoverLetter.pdf
- Answer 'Why do you want this job?': I'm passionate about..."
```

### E-commerce Checkout

```
"Add this item to cart, proceed to checkout, fill in shipping:
Name: Jane Smith
Address: 123 Main St
City: New York
State: NY
Zip: 10001
Don't complete payment - stop before payment page"
```

### Form with Dropdowns

```
"Fill the registration form:
- First Name: John
- Last Name: Doe
- Country: United States (select from dropdown)
- State: California (select from dropdown)
- Subscribe to newsletter: Yes (check the box)"
```

---

## Tips for Best Results

### ✅ DO

- Be specific about element descriptions ("the blue 'Submit' button")
- Use full file paths with proper escaping: `C:\\Users\\erich\\file.pdf`
- Break complex tasks into steps
- Include all necessary details (field names, values, etc.)

### ❌ DON'T

- Give vague instructions ("click the thing")
- Forget to specify which input field
- Try to automate CAPTCHAs (they're designed to prevent automation)
- Attempt to automate secured payment pages

---

## Debugging Failed Commands

If a command doesn't work:

1. **Be more specific:**
   - Bad: "Click the button"
   - Good: "Click the green 'Submit' button at the bottom of the form"

2. **Check the screenshot:**
   - Agent can only see what's in the viewport
   - Try: "Scroll down first, then click the button"

3. **Simplify:**
   - Instead of one big command, break into steps
   - Run each step separately

4. **Check console:**
   - F12 → Console tab
   - Look for red error messages

---

## Advanced: Using with VLSHomes

For your real estate listing automation:

```
"Navigate to vlshomes.com/members_mobi/, login with username MARIAODUBER,
then click 'Add Listing' in the sidebar"
```

```
"Fill out the listing form:
Address: 456 Ocean Drive
Town: Miami Beach
Price: 750000
Zip: 33139
Beds: 3
Bathrooms Full: 2
Bathrooms Half: 0
Square Feet: 1850
Year Built: 2005
Style: Ranch
Condition: Very Good
Construction: Concrete Block
Check the boxes for: Den, Dining Room
Description: Beautiful 3-bedroom home in Miami Beach..."
```

```
"After submitting the form, click 'Upload Main photo' and upload
C:\\Users\\erich\\Downloads\\house-photo.jpg"
```

---

## Want to Go Faster?

Once you've successfully run a command, you could:

1. **Save it as a workflow** (future feature)
2. **Create a text file** with common tasks
3. **Copy-paste** proven commands

Example saved commands file:
```
// my-tasks.txt
Login: "Go to vlshomes.com, login as MARIAODUBER"
New Listing: "Click Add Listing, fill basic info..."
Upload Photo: "Upload C:\\Users\\erich\\Downloads\\..."
```

---

Happy Automating! 🤖
