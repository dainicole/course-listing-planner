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

# print data-course-id for each course (see annotated_361.html for example))
print("code is running!")
for course in course_wrappers:
    course_id = course.get('data-course-id')
    print(course_id)