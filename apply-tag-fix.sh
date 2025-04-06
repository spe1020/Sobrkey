#!/bin/bash
# Script to apply the Sobrkey tag fix patch to HTML files

echo "Applying Sobrkey Tag Fix Patch..."

# Check if tag-fix-patch.js exists
if [ ! -f "tag-fix-patch.js" ]; then
  echo "Error: tag-fix-patch.js not found!"
  exit 1
fi

# Function to add the script to HTML files
add_script_to_html() {
  local file=$1
  
  # Check if the patch is already included
  if grep -q "tag-fix-patch.js" "$file"; then
    echo "Patch already applied to $file"
    return
  fi
  
  # Find the last script tag or the closing body tag
  if grep -q "</body>" "$file"; then
    # Add before closing body tag
    sed -i 's|</body>|<script src="/tag-fix-patch.js"></script>\n</body>|' "$file"
    echo "Added patch to $file before </body>"
  elif grep -q "</head>" "$file"; then
    # Add before closing head tag
    sed -i 's|</head>|<script src="/tag-fix-patch.js"></script>\n</head>|' "$file"
    echo "Added patch to $file before </head>"
  else
    echo "Could not find insertion point in $file"
    return
  fi
}

# Find all HTML files in public directory
find public -name "*.html" | while read html_file; do
  add_script_to_html "$html_file"
done

# Copy the patch file to the public directory
cp tag-fix-patch.js public/

echo "Patch application complete!"
echo "To manually add the patch to a specific HTML file, add this line before </body>:"
echo "<script src=\"/tag-fix-patch.js\"></script>"
