const { getUser } = require('../utils')

function userPosts(root, args, context) {
	return context.prisma.user({id: args.id}).posts()
}

async function checkPermission(parent, args, context) {
	const user = await getUser(context)
	return user == null ? null : user.role
}

async function coursesFromYear(root, args, context) {
	let courseRuns = await context.prisma.courseRuns({ where: {year: args.year} }).course()
	courseRuns = courseRuns.map(item => item.course)
	return courseRuns
}
async function gradeFromCourseID(root, args, context) {
	let courseGradeStudent = await context.prisma.studentCourseGrades({where: {course: { id: args.id }}})
	return courseGradeStudent
}
async function getGradeByID(root, args, context) {
	return await context.prisma.studentCourseGrade({id:args.id})
}


module.exports = {
	userPosts,
	coursesFromYear,
	checkPermission,
	gradeFromCourseID,
	getGradeByID
}