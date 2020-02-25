const { getUser } = require('../utils')

function userPosts(root, args, context) {
	return context.prisma.user({id: args.id}).posts()
}

async function checkPermission(parent, args, context) {
	const user = await getUser(context)
	return user == null ? null : user.role
}

async function gradeFromCourseID(root, args, context) {
	let courseGradeStudent = await context.prisma.studentCourseGrades({where: {course: { id: args.id }}})
	return courseGradeStudent
}
async function getGradeByID(root, args, context) {
	return await context.prisma.studentCourseGrade({id:args.id})
}
async function getOverallGrade(root, args, context) {
	return await context.prisma.overallGrade( {
		where: {
			year: args.year,
			studentLevel: args.level,
			student: {
				id: args.id
			}
		}
	})
}

async function getCourseRuns(root, args, context) {
	if (args.searchString && args.searchString.trim().length > 0) {
		let coursejoined ="";
		const indexOfSearchItems = (allCourses, searchStringArg) => allCourses.reduce(
				(acc, eachCourse, i) => {
					//console.log("eachcourse=", eachCourse);
					coursejoined = Object.values(eachCourse.course).join("")
					return coursejoined.toLowerCase().includes(searchStringArg) ? [...acc, i] : acc
				},
			[]);

	let searchStringArg = args.searchString.toLowerCase();
	let allCourseRuns = await context.prisma.courseRuns();
	let allCourses = await context.prisma.courseRuns().course();
	let MatchedIndices = indexOfSearchItems(allCourses,searchStringArg);
	//console.log("MatchedIndices=", MatchedIndices);
	return await allCourseRuns.filter( (courseRun, index) => MatchedIndices.indexOf(index)>=0)
	// return await allCourses.filter((course) => {
	// 	let tempcourse = course.course();
	// 	//coursejoined= Object.values(course.course).join("");
	// 	console.log("============");
	// 	console.log("getCourseRuns::course=", course);
	// 	console.log("getCourseRuns::coursejoined=", coursejoined);
	// 	console.log("============");
	// 	return tempcourse.toLowerCase().includes(searchStringArg)
	// });
}
return await context.prisma.courseRuns();
}

async function getStudents(root, args, context) {
    let allStudents = await context.prisma.students();
    if (args.searchString && args.searchString.trim().length > 0) {
        let searchStringArg = args.searchString.toLowerCase().split(" ");
        if (searchStringArg.length>1){
            return allStudents.filter( (student) => student.surname.toLowerCase().includes(searchStringArg[1]) &&
        student.firstname.toLowerCase().includes(searchStringArg[0]))
        }else{
        return allStudents.filter( (student) => student.surname.toLowerCase().includes(searchStringArg[0]) ||
        student.firstname.toLowerCase().includes(searchStringArg[0]) || 
        student.guid.toLowerCase().includes(searchStringArg[0]))
        }
        
    }
    return await allStudents
}

async function getCourses(root, args, context) {
	if (args.searchString && args.searchString.trim().length > 0) {
		let searchStringArg = args.searchString.toLowerCase();
		let allCourses = await context.prisma.courses();
		return allCourses.filter((course) => course.name.toLowerCase().includes(searchStringArg) ||
			course.courseID.toLowerCase().includes(searchStringArg));
	}
	return await context.prisma.courses();
}

async function getDegrees(root, args, context) {
	if (args.searchString) {
		let searchStringArg = args.searchString.toLowerCase();
		let allDegrees = await context.prisma.degrees();
		return allDegrees.filter((degree) => degree.degreeCode.toLowerCase().includes(searchStringArg) ||
		degree.name.toLowerCase().includes(searchStringArg));
	}
	return await context.prisma.degrees();
}

async function getcourseDegreeWeight(root, args, context) {
	return await context.prisma.courseDegreeWeight({where: {id:args.id}});
}

async function getcourseDegreeWeights(root, args, context) {
	return await context.prisma.courseDegreeWeights({where: {id:args.degree}});
}

async function getUsers(root, args,context) {
	return await context.prisma.users()
}



module.exports = {
	userPosts,
	checkPermission,
	gradeFromCourseID,
	getGradeByID,
	getOverallGrade,
	getUsers,
	getStudents,
	getDegrees,
	getcourseDegreeWeight,
	getcourseDegreeWeights,
	getCourseRuns,
	getCourses
}