# TODO add bs4 into our download list           pip install beautifulsoup4
from bs4 import BeautifulSoup
import re
from dataclasses import dataclass
from typing import Optional
import pprint

# constants to look for in html (in case they get updated later)
# note: "class" here refers to html class, I'm using "course" to refer to the thing students can enroll in
COURSE_WRAPPER_CLASS = "scpi__classes--row"
NEW_COURSE_ID_CLASS = "scpi-class__heading middle" # ex: "CSE 3601" is the new version of "CSE 361"
COURSE_TITLE_CLASS = "scpi-class__heading wide"
COURSE_DEPARTMENT_CLASS = "scpi-class__department"
COURSE_DESCRIPTION_CLASS = "scpi-class__details--content"

# other constants
PLACEHOLDER = "PLACEHOLDER" # for if there's not a valid short course id to parse

# turns, for example, "CRS_CSE-E81_361S" into "CSE 361"
def parse_course_id(course_id):
    match = re.search(r"CRS_([A-Z]+).*?_(\d+)", course_id)
    if match:
        dept = match.group(1)
        num = match.group(2)
        return f"{dept} {num}"
    else:
        return None

# get old course id from outer html
def get_old_course_id(course_wrapper):
    old_course_id_full = (str)(course_wrapper.get('data-course-id'))
    old_id_short = parse_course_id(old_course_id_full)
    if old_id_short:
        return old_course_id_full, old_id_short, True # return true to show successful extraction
    else:
        return old_course_id_full, PLACEHOLDER, False # false to show failed to parse

# helper function to find course info from div text
def extract_inner_html(course_wrapper, div_class):
    div = course_wrapper.find('div', class_ = div_class)
    if div:
        inner_text = div.get_text(strip=True)
        return inner_text

# get new course id from inner html
def get_new_course_id(course_wrapper):
    new_id = extract_inner_html(course_wrapper, NEW_COURSE_ID_CLASS)
    return new_id

# get title from inner html
def get_course_title(course_wrapper):
    title = extract_inner_html(course_wrapper, COURSE_TITLE_CLASS)
    return title
    
# get course department from inner html
def get_course_department(course_wrapper):
    department = extract_inner_html(course_wrapper, COURSE_DEPARTMENT_CLASS)
    return department

# get course description from inner html
def get_course_description(course_wrapper):
    description = extract_inner_html(course_wrapper, COURSE_DESCRIPTION_CLASS)
    return description

def extract_prereqs_string(course_description):
    # pattern returns what comes after "Prerequisite" + (optional chars, like s) + ":"
    # ends string early at * character (if present) because that indicates "this class has mandatory evening exams"
    # also ends string early if it contains "Revised:" (ex: "Revised: 2019-02-21")
    pattern = r'Prerequisite[\w\s]*:\s*(.*?)(?:\*|Revised:|$)'
    match = re.search(pattern, course_description, re.IGNORECASE)
    if match:
        prereqs_string = match.group(1)
        return prereqs_string
    else:
        return None     # no prereqs
        
def parse_prereqs_string(prereq_string):
    # matches 3-5 letter department code, an optional space, followed by 3-4 numbers (optional letter at end)
    # (covers things like CSE131, CSE 131, Math 310, Math 3200, CSE 361S)
    course_pattern = r'\b[A-Za-z]{3,5} ?\d{3,4}[A-Za-z]?\b'
    course_prereq_list = re.findall(course_pattern, prereq_string)
    # covers junior/senior/graduate standing
    school_year_pattern = r'\b(junior|senior|graduate)\b'
    school_year_req_list = re.findall(school_year_pattern, prereq_string, re.IGNORECASE)
    school_year_req_list = [s.upper() for s in school_year_req_list] # make uppercase for consistency

    return course_prereq_list, school_year_req_list # TODO figure out how to deal with "and" vs "or" for what's required


@dataclass
class CourseInfo:
    title: Optional[str]
    department: Optional[str]
    description: Optional[str]
    prereq_string: Optional[str]
    new_id: Optional[str]
    old_id_full: Optional[str]
    old_id_short: str
    old_id_valid: bool # sometimes html gives something unhelpful like COURSE_DEFINITION-3-61543
    
    



def main():
    # open html file (I downloaded the page for easier testing, will change later)
    with open("creative_project/python_web_scraper/SP26_11.12.html", "r", encoding="utf-8") as f:
        html_content = f.read()
    soup = BeautifulSoup(html_content, 'html.parser')
    course_wrappers = soup.find_all('div', class_ = COURSE_WRAPPER_CLASS)

    # populate courses from webpage
    courses = []
    for course in course_wrappers:
        old_id_full, old_id_short, old_id_valid = get_old_course_id(course)
        new_id = get_new_course_id(course)
        title = get_course_title(course)
        department = get_course_department(course)
        description = get_course_description(course)
        prereq_string = extract_prereqs_string(description)

        courses.append(
            CourseInfo(
                title = title,
                department = department,
                description = description,
                prereq_string = prereq_string,
                new_id = new_id,
                old_id_full  = old_id_full,
                old_id_short = old_id_short,
                old_id_valid = old_id_valid
            )
        )

    for course in courses:
        # pprint.pprint(course)
        if (course.prereq_string):
            course_prereq_list, school_year_req_list = parse_prereqs_string(course.prereq_string)
            print(f"Prereq String:   {course.prereq_string}")
            print(f"       List:     {course_prereq_list}")
            print(f"                 {school_year_req_list}")
            print()







if __name__ == "__main__":
    main()