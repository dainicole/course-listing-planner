# TODO add bs4 into our download list           pip install beautifulsoup4
from bs4 import BeautifulSoup
import re
from dataclasses import dataclass, asdict
from typing import Optional
import pprint
# TODO add this into download list too          pip install neo4j
from neo4j import GraphDatabase

# constants to look for in html (in case they get updated later)
# note: "class" here refers to html class, I'm using "course" to refer to the thing students can enroll in
COURSE_WRAPPER_CLASS = "scpi__classes--row"
NEW_COURSE_ID_CLASS = "scpi-class__heading middle" # ex: "CSE 3601" is the new version of "CSE 361"
COURSE_TITLE_CLASS = "scpi-class__heading wide"
COURSE_DEPARTMENT_CLASS = "scpi-class__department"
COURSE_DESCRIPTION_CLASS = "scpi-class__details--content"

#constants for database
URI = "neo4j://localhost:7687"
AUTH = ("neo4j", "12345678") # TODO change if make other instance
DATABASE_NAME = "CoursePrereqDB"

# other constants
PLACEHOLDER = "PLACEHOLDER" # for if there's not a valid short course id to parse

# turns, for example, "CRS_CSE-E81_361S" into "CSE 361S"
def parse_course_id(course_id):
    match = re.search(r"CRS_([A-Z]+).*?_(\d{3,4}[A-Za-z]?)", course_id)
    if match:
        dept = match.group(1)
        code = match.group(2)
        return f"{dept} {code}"
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
    
# returns youngest eligible grade level (ex: if juniors and seniors can both take, return "JUNIOR")
def find_min_school_year_req(prereq_string):
    school_year_pattern = r'\b(junior|senior|graduate)\b'
    matches = re.findall(school_year_pattern, prereq_string, re.IGNORECASE)
    if not matches:
        return None
    
    min_school_year_req_list = [m.upper() for m in matches] # make uppercase for consistency
    
    grade_levels = ["JUNIOR", "SENIOR", "GRADUATE"]

    # return the youngest grade level that meets prereq requirement
    for standing in grade_levels:
        if standing in min_school_year_req_list:
            return standing
        
def parse_prereqs_string(prereq_string):
    # matches 3-5 letter department code, an optional space, followed by 3-4 numbers (optional letter at end)
    # (covers things like CSE131, CSE 131, Math 310, Math 3200, CSE 361S)
    course_pattern = r'\b[A-Za-z]{3,5} ?\d{3,4}[A-Za-z]?\b'
    course_prereq_list = re.findall(course_pattern, prereq_string) # TODO turn things like 'CSE247' into 'CSE 247'
    # covers junior/senior/graduate standing
    min_school_year_req = find_min_school_year_req(prereq_string)
    return course_prereq_list, min_school_year_req # TODO figure out how to deal with "and" vs "or" for what's required

def establish_old_id_to_new_id_map(courses):
    old_to_new_id_map = {course.old_id_short: course.new_id for course in courses if course.old_id_valid} # TODO how to handle invalid old ids?
    return old_to_new_id_map

def convert_prereq_list_old_id_to_new(prereq_list, old_to_new_id_map):
    prereq_list_new_ids = [old_to_new_id_map.get(old_id, None) for old_id in prereq_list]
    prereq_list_new_ids = [item for item in prereq_list_new_ids if item is not None] # filter out "None" for database

    return prereq_list_new_ids



@dataclass
class CourseInfo:
    title: Optional[str]
    new_id: Optional[str]
    department: Optional[str]
    description: Optional[str]
    prereq_string: Optional[str]
    course_prereq_list: Optional[list[str]] # has old IDs, like "CSE 361" or "CSE 361S"
    min_school_year_req: Optional[str]
    old_id_full: Optional[str]
    old_id_short: str
    old_id_valid: bool # sometimes html gives something unhelpful like COURSE_DEFINITION-3-61543
    prereq_list_new_ids: Optional[list[str]] = None # will have new IDs, like "CSE 3601"
    
# just making the individual nodes, will set up the prereq relationship later
def upload_to_db(data):
    CYPHER_IMPORT_QUERY = """
        UNWIND $courseData AS course
        MERGE (c:Course {id: course.new_id})
        SET 
            c.title = course.title,
            c.description = course.description,
            c.old_id_full = course.old_id_full,
            c.old_id_short = course.old_id_short,
            c.old_id_valid = course.old_id_valid,
            c.min_year = course.min_school_year_req,
            c.prereq_string = course.prereq_string,
            c.prereq_list = course.prereq_list_new_ids

        MERGE (d:Department {name: course.department})

        MERGE (d)-[:HAS_COURSE]->(c)

        RETURN c.id
        """

    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        driver.verify_connectivity()
        print("Connected to Neo4j successfully!")

        summary = driver.execute_query(
            CYPHER_IMPORT_QUERY,
            courseData=data, 
            database_=DATABASE_NAME,
        ).summary

        print(f"Nodes created: {summary.counters.nodes_created}")
        print(f"Relationships created: {summary.counters.relationships_created}")

# make prereq relationships
def create_prerequisite_relationships(data):
    CYPHER_PREREQ_QUERY = """
        UNWIND $courseData AS course
        UNWIND course.prereq_list_new_ids AS prereq_id 

        MATCH (c:Course {id: course.new_id}) 
        MATCH (p:Course {id: prereq_id})

        MERGE (p)-[:IS_REQUIRED_BY]->(c)
        """
    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        # Execute the prerequisite query
        summary = driver.execute_query(
            CYPHER_PREREQ_QUERY,
            courseData=data,
            database_=DATABASE_NAME,
        ).summary

        print(f"Prerequisite relationships created: {summary.counters.relationships_created}")






def main():
    print("running code")
    # open html file (I downloaded the page for easier testing, will change later)
    with open("C:/Users/aylab/cse330/creative_project/python_web_scraper/SP26_11.12.html", "r", encoding="utf-8") as f:
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
        if (prereq_string):
            course_prereq_list, min_school_year_req = parse_prereqs_string(prereq_string)
        else:
            # make sure ghost prereqs aren't created
            course_prereq_list = None
            min_school_year_req = None

        courses.append(
            CourseInfo(
                title = title,
                new_id = new_id,
                department = department,
                description = description,
                prereq_string = prereq_string,
                course_prereq_list = course_prereq_list, 
                min_school_year_req = min_school_year_req,
                old_id_full  = old_id_full,
                old_id_short = old_id_short,
                old_id_valid = old_id_valid
            )
        )
    
    print("finished scraping html")

    # convert prereq list from old IDs to new (for database relationships)
    old_to_new_id_map = establish_old_id_to_new_id_map(courses)
    for course in courses:
        if (course.course_prereq_list):
            course.prereq_list_new_ids = convert_prereq_list_old_id_to_new(course.course_prereq_list, old_to_new_id_map)



    # for course in courses:
    #     # print(f'Old ID: {course.old_id_short}')
    #     # print(f'     NEW ID: {course.new_id}')
    #     # pprint.pprint(course)
    #     if (not(course.prereq_string)):
    #         print(f"Prereq String:   {course.prereq_string}")
    #         print(f"     Prereq old IDs:   {course.course_prereq_list}")
    #         print(f"     Prereq new IDs:   {course.prereq_list_new_ids}")
    #         # if (course.min_school_year_req):
    #         #     print(f" Min standing:   {course.min_school_year_req}")
    #     print()

    data_for_neo4j = [asdict(course) for course in courses]

    # set up database
    upload_to_db(data_for_neo4j)
    create_prerequisite_relationships(data_for_neo4j)

    print("DONE!")


if __name__ == "__main__":
    main()