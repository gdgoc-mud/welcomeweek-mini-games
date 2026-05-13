export const debugBank = [
	{
		id: 1,
		title: "Bug 1 — Array Indexing (Java)",
		code: `public class Main {
    public static void main(String[] args) {
        int[] numbers = {1, 2, 3, 4, 5};
        System.out.println(numbers[5]); 
    }
}`,
		question: "Print the last letter in the array numbers. It currently dosen’t",
		hint: "Arrays are zero-indexed. The 5th element is at index 4.",
		validate: (userCode) => {
			const clean = userCode.replace(/\s/g, '');
			return clean.includes('numbers[4]');
		}
	},
	{
		id: 2,
		title: "Bug 2 — Flask Routing (Python)",
		code: `from flask import Flask 

app = Flask.(__name__) 

app.route('/')
def hello():
    return "Hello World"

if __name__ == "__main__":
    app.run()`,
		question: "After deployment, a 404 error occurs? What can you do to fix this?",
		hint: "Check how Flask is instantiated, and decorators in Python require a specific symbol.",
		validate: (userCode) => {
			const clean = userCode.replace(/\s/g, '');
			return clean.includes('Flask(__name__)') && clean.includes('@app.route');
		}
	},
	{
		id: 3,
		title: "Bug 3 — Tree Traversal (C++)",
		code: `template<typename T>
Bst<T>::inorder(node<T> *p) const {
    if(p != nullptr) {
        std::cout << p->data << " "; 
        inorder(p->leftLink);
        inorder(p->rightLink);
    }
}`,
		question: "When traversing a binary search tree, the tree values are not printed in ascending order. How would you fix this?",
		hint: "In-order traversal should process the left child, then the current node, then the right child.",
		validate: (userCode) => {
			const clean = userCode.replace(/\s/g, '');
			const leftIndex = clean.indexOf('inorder(p->leftLink);');
			const printIndex = clean.indexOf('std::cout<<p->data');
			const rightIndex = clean.indexOf('inorder(p->rightLink);');
			return leftIndex !== -1 && printIndex !== -1 && rightIndex !== -1 &&
			       leftIndex < printIndex && printIndex < rightIndex;
		}
	},
	{
		id: 4,
		title: "Bug 4 — Loop Bounds & Printing (C)",
		code: `int main() {
    int size = 5;
    int array[5] = {10, 20, 30, 40, 50};
    
    for(int i = 1; i <= size; i++) { 
        printf("Element: %d | Index: %d \\n", i, array[i]); 
    }
    return 0;
}`,
		question: "This algorithm skips the first element, swaps output values, and goes out of bounds. How could you fix this?",
		hint: "Check the loop start, loop condition, and the order of variables passed to printf.",
		validate: (userCode) => {
			const clean = userCode.replace(/\s/g, '');
			const validLoop = clean.includes('i=0;i<size') || clean.includes('i=0;i<5');
			const validPrint = clean.includes('array[i],i)') || clean.includes('*(array+i),i)');
			return validLoop && validPrint;
		}
	},
	{
		id: 5,
		title: "Bug 5 — Array Addition (JavaScript)",
		code: `function addAll() {
    let odd = [1,3,5,7];
    let even = [2,4,6,8];
    
    let sum = odd + even; 
    console.log(sum);
}

addAll();`,
		question: "The addAll() function is intended to calculate and log the sum of two arrays (odd and even). However, the code below produces a string output of “1,3,5,72,4,6,8”. How would you fix this?",
		hint: "Adding arrays in JS converts them to strings. You need to iterate through them (e.g. with .reduce() or a loop) and add the numbers.",
		validate: (userCode) => {
			const clean = userCode.replace(/\s/g, '');
			const removedEvilPlus = !clean.includes('sum=odd+even;');
			const usedReduce = clean.includes('.reduce(');
			const usedLoop = clean.includes('for(') || clean.includes('forEach(') || clean.includes('while(');
			const hardcoded = clean.includes('sum=36') || clean.includes('console.log(36)');
			
			return removedEvilPlus && (usedReduce || usedLoop || hardcoded);
		}
	},
	{
		id: 6,
		title: "Bug 6 — Infinite Loop (C++)",
		code: `#include <iostream>
int main() {
    int i = 1;
    while (i < 6) {
        std::cout << i << std::endl;
        i--;
    }
    return 0;
}`,
		question: "This loop is supposed to print numbers 1 through 5, but it runs forever. How would you fix this?",
		hint: "The counter is moving in the wrong direction.",
		validate: (userCode) => {
			const clean = userCode.replace(/\s/g, '');
			return clean.includes('i++') && !clean.includes('i--');
		}
	},
	{
		id: 7,
		title: "Bug 7 — SQL Syntax (SQL)",
		code: `SELECT * FROM students
WHERE grade => 80;`,
		question: "This query is supposed to find all students with a grade above 80, but it returns no results. How would you fix this?",
		hint: "The greater-than-or-equal-to operator is written in a specific order.",
		validate: (userCode) => {
			const clean = userCode.replace(/\s/g, '');
			return clean.includes('grade>=80');
		}
	}
];