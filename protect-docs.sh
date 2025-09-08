#!/bin/bash

# Documentation Protection Script
# Run this to set up protection for critical documentation

echo "🔒 Setting up documentation protection..."

# List of protected files
PROTECTED_FILES=(
    "DEVELOPMENT_GUIDE.md"
    "QUICK_REFERENCE.md" 
    "DEVELOPER_CHECKLIST.md"
    "DOCUMENTATION_PROTECTION.md"
)

# Create backups
echo "📄 Creating backups..."
for file in "${PROTECTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup"
        echo "  ✅ Backed up: $file"
    fi
done

# Set read-only permissions (if supported)
echo "🔐 Setting read-only permissions..."
for file in "${PROTECTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        chmod 444 "$file" 2>/dev/null && echo "  ✅ Protected: $file" || echo "  ⚠️  Read-only not available: $file"
    fi
done

# Create git hook to prevent unauthorized changes
echo "🪝 Setting up git pre-commit hook..."
HOOK_DIR=".git/hooks"
HOOK_FILE="$HOOK_DIR/pre-commit"

if [ -d "$HOOK_DIR" ]; then
    cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash
# Documentation protection pre-commit hook

PROTECTED_FILES="DEVELOPMENT_GUIDE.md QUICK_REFERENCE.md DEVELOPER_CHECKLIST.md DOCUMENTATION_PROTECTION.md"

echo "🔍 Checking for protected file modifications..."

for file in $PROTECTED_FILES; do
    if git diff --cached --name-only | grep -q "^$file$"; then
        echo ""
        echo "🚨 COMMIT BLOCKED 🚨"
        echo "File '$file' is protected and requires authorization from erinb-maker-radio"
        echo ""
        echo "To override (emergencies only):"
        echo "  git commit --no-verify"
        echo ""
        echo "See DOCUMENTATION_PROTECTION.md for authorization process"
        exit 1
    fi
done

echo "✅ No protected files modified"
EOF

    chmod +x "$HOOK_FILE"
    echo "  ✅ Git pre-commit hook installed"
else
    echo "  ⚠️  No .git directory found - git hook not installed"
fi

echo ""
echo "✅ Documentation protection system active!"
echo ""
echo "Protected files:"
for file in "${PROTECTED_FILES[@]}"; do
    echo "  🔒 $file"
done
echo ""
echo "To authorize changes, see: DOCUMENTATION_PROTECTION.md"