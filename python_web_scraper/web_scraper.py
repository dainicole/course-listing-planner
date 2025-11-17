# TODO add bs4 into our download list           pip install beautifulsoup4
from bs4 import BeautifulSoup

# constants to look for in html (in case they get updated later)
# note: "class" here refers to html class, I'm using "course" to refer to the thing students can enroll in
COURSE_WRAPPER_CLASS = "scpi__classes--row"
NEW_COURSE_ID_CLASS = "scpi-class__heading middle" # ex: "CSE 3601" is the new version of "CSE 361"
COURSE_TITLE_CLASS = "scpi-class__heading wide"
COURSE_DESCRIPTION_CLASS = "scpi-class__details--content"

# open html file (I downloaded the page for easier testing, will change later)
with open("creative_project/python_web_scraper/SP26_11.12.html", "r", encoding="utf-8") as f:
    html_content = f.read()

# parse html
soup = BeautifulSoup(html_content, 'html.parser')

# find all divs with this html class
course_wrappers = soup.find_all('div', class_ = COURSE_WRAPPER_CLASS)

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

# get old course id from outer html
def get_old_course_id(course_wrapper):
    old_course_id_full = course_wrapper.get('data-course-id')
    old_id_short = parse_course_id(old_course_id_full)
    if old_id_short:
        print(f"Old course id: {old_id_short}")
        return old_id_short, True # return true to show successful extraction
    else:
        print(f"Old course id (doesn't match format): {old_course_id_full}")
        return old_course_id_full, False # false to show failed to parse

# helper function to find course info from div text
def extract_inner_html(course_wrapper, div_class):
    div = course_wrapper.find('div', class_ = div_class)
    if div:
        inner_text = div.get_text(strip=True)
        return inner_text

# get new course id from inner html
def get_new_course_id(course_wrapper):
    new_id = extract_inner_html(course_wrapper, NEW_COURSE_ID_CLASS)
    print(f"    New course id: {new_id}")
    return new_id

# get title from inner html
def get_course_title(course_wrapper):
    title = extract_inner_html(course_wrapper, COURSE_TITLE_CLASS)
    print(f"    Course title: {title}")
    return title
    
# get course description from inner html
def get_course_description(course_wrapper):
    description = extract_inner_html(course_wrapper, COURSE_DESCRIPTION_CLASS)
    print(f"    Course description: {description}")
    return description
    



# print data-course-id for each course (see annotated_361.html for example))
print("code is running!")
for course in course_wrappers:
    old_id, is_correct_format = get_old_course_id(course)
    new_id = get_new_course_id(course)
    title = get_course_title(course)
    description = get_course_description(course)
    print()