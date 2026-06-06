export type CollegeOption = {
  value: string;
  label: string;
  shortLabel?: string;
};

const rawColleges: CollegeOption[] = [
  { value: "abes-engineering-college", label: "ABES Engineering College" },
  { value: "abes-institute-of-technology", label: "ABES Institute of Technology" },
  { value: "babu-banarasi-das", label: "Babu Banarasi Das Institute of Technology and Management" },
  { value: "dr-apj-abdul-kalam-technical-university", label: "Dr. A.P.J. Abdul Kalam Technical University" },
  { value: "galgotias-college", label: "Galgotias College of Engineering and Technology" },
  { value: "gl-bajaj", label: "GL Bajaj Institute of Technology and Management" },
  { value: "greater-noida-institute", label: "Greater Noida Institute of Technology" },
  { value: "iimt-college", label: "IIMT College of Engineering" },
  { value: "ims-engineering-college", label: "IMS Engineering College" },
  { value: "inderprastha-engineering-college", label: "Inderprastha Engineering College" },
  { value: "jss-academy", label: "JSS Academy of Technical Education Noida" },
  { value: "kiet-group", label: "KIET Group of Institutions" },
  { value: "krishna-engineering-college", label: "Krishna Engineering College" },
  { value: "meerut-institute", label: "Meerut Institute of Engineering and Technology" },
  { value: "moradabad-institute", label: "Moradabad Institute of Technology" },
  { value: "noida-institute", label: "Noida Institute of Engineering and Technology" },
  { value: "raj-kumar-goel", label: "Raj Kumar Goel Institute of Technology" },
  { value: "rkgit", label: "RKGIT" },
  { value: "sr-group", label: "SR Group of Institutions" },
].sort((a, b) => a.label.localeCompare(b.label));

export const aktuColleges: CollegeOption[] = [
  {
    value: "ajay-kumar-garg-engineering-college",
    label: "Ajay Kumar Garg Engineering College",
    shortLabel: "AKGEC",
  },
  ...rawColleges,
];
