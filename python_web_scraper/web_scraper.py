# TODO add bs4 into our download list           pip install beautifulsoup4
from bs4 import BeautifulSoup

# constants to look for in html (in case they get updated later)
# note: "class" here refers to html class, I'm using "course" to refer to the thing students can enroll in
course_wrapper_class = "scpi__classes--row"

# open html file (I downloaded the page for easier testing, will change later)
with open("creative_project/python_web_scraper/SP26_11.12.html", "r", encoding="utf-8") as f:
    html_content = f.read()

# parse html
soup = BeautifulSoup(html_content, 'html.parser')

# find all divs with this html class
course_wrappers = soup.find_all('div', class_ = course_wrapper_class)

# turns, for example, "CRS_CSE-E81_361S" into "CSE 361"
def parse_course_id(course_id):
    import re
    match = re.search(r"CRS_([A-Z]+).*?_(\d+)", course_id)
    if match:
        dept = match.group(1)
        num = match.group(2)
        return f"{dept} {num}"
    else:
        return None


# print data-course-id for each course (see annotated_361.html for example))
print("code is running!")
for course in course_wrappers:
    html_wrapper_course_id = course.get('data-course-id')
    formatted = parse_course_id(html_wrapper_course_id)
    if formatted:
        print(formatted)
    else:
        print(f"Doesn't match course format: {html_wrapper_course_id}")