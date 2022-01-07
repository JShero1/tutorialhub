// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

}


contract TutorialHub {

    using SafeMath for uint;
    uint internal tutorialCount = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Tutorial {
        address payable instructor;
        string title;
        string video;
        string thumbnail;
        string description;
        uint students;
        uint price;
    }

    mapping (uint => Tutorial) internal tutorials;

    // instructor modifier
    modifier onlyInstructor(uint _index) {
        require(tutorials[_index].instructor == payable(msg.sender), 'only instructor can modify parameters');
        _;
    }

     // admin modifier
    modifier notInstructor(uint _index) {
        require(tutorials[_index].instructor == payable(msg.sender), 'you can not modify parameters');
        _;
    }


    // create a video
    function uploadTutorial (
        string memory _title,
        string memory _video,
        string memory _thumbnail,
        string memory _description,
        uint _price
    ) public {
        tutorials[tutorialCount] = Tutorial(
            payable(msg.sender),
            _title,
            _video,
            _thumbnail,
            _description,
            _price,
            0
        );
        tutorialCount++;
    }

    // get a certain video
    function getTutorial(uint _index) public view returns (
        address payable,
        string memory, 
        string memory, 
        string memory,
        string memory,
        uint,
        uint
    ) {
        return (
            tutorials[_index].instructor,
            tutorials[_index].title,
            tutorials[_index].video,
            tutorials[_index].thumbnail,
            tutorials[_index].description,
            tutorials[_index].students,
            tutorials[_index].price
        );
    }
    
    // support video
    function buyTutorial(uint _index) notInstructor(_index) public payable  {

        require(
                IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                tutorials[_index].instructor,
                tutorials[_index].price), "Transfer failed."
            );

        tutorials[_index].students.add(1);
    }
    
    // get number of tutorials
    function getTutorialCount() public view returns (uint) {
        return (tutorialCount);
    }
    
    // edit video parameters
    function editTutorial(
        uint _index,
        uint _price,
        string memory _title,
        string memory _video,
        string memory _thumbnail,
        string memory _description
    ) onlyInstructor(_index) public {
        tutorials[_index].price = _price;
        tutorials[_index].title = _title;
        tutorials[_index].video = _video;
        tutorials[_index].thumbnail = _thumbnail;
        tutorials[_index].description = _description;
    }
    
    // make another person the instructor
    function transferInstructor(uint _index, address _newInstructor) onlyInstructor(_index) public {
         require(_newInstructor != address(0), "new instructor cannot be the zero address");

        tutorials[_index].instructor = payable(_newInstructor);
    }
}
