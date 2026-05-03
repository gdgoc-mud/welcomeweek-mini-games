export const debugBank = [
	{
		id: 1,
		title: "Bug 1 — Off-by-one (Python, Easy)",
		code: `def count_to_ten():
    for i in range(1, 10):
        print(i)

count_to_ten()`,
		question: "The function is supposed to print 1 through 10 inclusive. Fix the code.",
		hint: "The range end is exclusive.",
		validate: (userCode) => {
			const clean = userCode.replace(/\s/g, '');
			return clean.includes('range(1,11)');
		}
	},
	{
		id: 2,
		title: "Bug 2 — Wrong operator (Python, Easy-Medium)",
		code: `def is_even(n):
    if n / 2 == 0:
        return True
    return False

print(is_even(4))  # Expected: True
print(is_even(3))  # Expected: False`,
		question: "This function always returns False. Fix the operator so it correctly checks if the number is even.",
		hint: "Division (/) gives a quotient. You need the remainder operator.",
		validate: (userCode) => {
			const clean = userCode.replace(/\s/g, '');
			return clean.includes('n%2==0') || clean.includes('n%2is0');
		}
	},
	{
		id: 3,
		title: "Bug 3 — Missing return (JavaScript, Medium)",
		code: `function multiply(a, b) {
    let result = a * b;
}

console.log(multiply(3, 4)); // Expected: 12`,
		question: "The function logs `undefined`. Edit the code to fix it.",
		hint: "The value is computed but never sent back to the caller.",
		validate: (userCode) => {
			const clean = userCode.replace(/\s/g, '');
			return clean.includes('returnresult;') || clean.includes('returnresult') || clean.includes('returna*b');
		}
	},
	{
		id: 4,
		title: "Bug 4 — Logic error (Python, Medium-Hard)",
		code: `def grade(score):
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 50:
        return "D"
    if score >= 60:
        return "F"

print(grade(55))  # Expected: D`,
		question: "The grading logic has a structural issue. `grade(65)` returns the wrong grade. Fix the code.",
		hint: "Check the order of the conditions. What happens if score is 65?",
		validate: (userCode) => {
			const dIndex = userCode.indexOf('>= 50');
			const fIndex = userCode.indexOf('>= 60');
			const clean = userCode.replace(/\s/g, '');
			const has50 = clean.includes('score>=50:\nreturn"F"');
			// If they swapped the blocks:
			const has60first = userCode.indexOf('60') < userCode.indexOf('50') && userCode.indexOf('50') !== -1;
			return has60first || clean.includes('score>=60:\nreturn"D"'); 
		}
	},
	{
		id: 5,
		title: "Bug 5 — Type error (JavaScript, Hard)",
		code: `function totalPrice(items) {
    let total = 0;
    for (let item of items) {
        total += item.price;
    }
    return "Total: " + total;
}

const cart = [
    { name: "Pen", price: "2" },
    { name: "Book", price: "15" },
    { name: "Bag", price: "40" }
];

console.log(totalPrice(cart));`,
		question: "The prices are strings, causing concatenation instead of addition. Fix the addition.",
		hint: "Use Number(), parseInt(), or a plus sign (+) to cast `item.price` to a number before adding.",
		validate: (userCode) => {
			const clean = userCode.replace(/\s/g, '');
			return clean.includes('Number(item.price)') 
				|| clean.includes('parseInt(item.price)') 
				|| clean.includes('parseFloat(item.price)')
				|| clean.includes('total+=+item.price')
				|| clean.includes('total+=item.price*1')
				|| clean.includes('Number(item.price');
		}
	}
];