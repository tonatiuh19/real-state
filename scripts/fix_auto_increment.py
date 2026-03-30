import re

with open('database/schema.sql', 'r') as f:
    content = f.read()

def add_auto_increment_to_create(match):
    block = match.group(0)
    block = re.sub(
        r'(`id`\s+int(?:\(\d+\))?(?:\s+unsigned)?\s+NOT NULL)(?!\s+AUTO_INCREMENT)',
        r'\1 AUTO_INCREMENT',
        block,
        count=1
    )
    return block

content_new = re.sub(
    r'CREATE TABLE `[^`]+` \(.*?\) ENGINE=[^\n]+',
    add_auto_increment_to_create,
    content,
    flags=re.DOTALL
)

count = content_new.count('AUTO_INCREMENT') - content.count('AUTO_INCREMENT')

with open('database/schema.sql', 'w') as f:
    f.write(content_new)

print(f"Added AUTO_INCREMENT to {count} id columns in CREATE TABLE statements")
