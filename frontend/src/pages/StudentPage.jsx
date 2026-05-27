import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { useParams } from "react-router-dom";
import axios from "axios";
import { formatAadhaar } from "../utils/validation";
import schoolLogo from "../images/logo.png"

// Add styles for input-edit class
const inputEditStyles = `
  .input-edit {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background-color: #f9fafb;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-edit:focus {
    outline: none;
    border-color: #E38B52;
    box-shadow: 0 0 0 3px rgba(227, 139, 82, 0.1);
    background-color: white;
  }
  .input-edit:read-only {
    background-color: #f3f4f6;
    color: #6b7280;
  }
  @keyframes pulsate {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(227, 139, 82, 0.7);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 0 8px rgba(227, 139, 82, 0);
    }
  }
  .pulsate-edit {
    animation: pulsate 1s ease-in-out 3;
  }
`;

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const RELIGION_OPTIONS = [
  { value: "hinduism", label: "Hinduism" },
  { value: "christianity", label: "Christianity" },
  { value: "islam", label: "Islam" },
  { value: "sikhism", label: "Sikhism" },
  { value: "buddhism", label: "Buddhism" },
  { value: "jainism", label: "Jainism" },
  { value: "Other", label: "Other" },
];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CLASS_OPTIONS = [
  "PrePrimary",
  "Primary 1",
  "Primary 2",
  "Secondary",
  "Pre vocational 1",
  "Pre vocational 2",
  "Care group below 18 years",
  "Care group Above 18 years",
  "Vocational 18-35 years",
];
const DIVISION_OPTIONS = ["A", "B", "C", "D"];
const CATEGORY_OPTIONS = ["General", "OBC", "SC", "ST"];

// Add styles to document head
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = inputEditStyles;
  document.head.appendChild(styleElement);
}

// Count-up animation component
const CountUp = ({ end, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}</span>;
};

const DynamicScrollButtons = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 1. Define "dead zones" at the top and bottom of the page
      const topThreshold = 200;
      const bottomOffset = 200;

      const isNearBottom =
        window.innerHeight + currentScrollY >=
        document.documentElement.offsetHeight - bottomOffset;

      // 2. Set visibility: only show buttons if we are outside the dead zones
      if (currentScrollY > topThreshold && !isNearBottom) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // 3. Determine scroll direction
      if (currentScrollY > lastScrollY.current) {
        setIsScrollingUp(false); // User is scrolling DOWN
      } else {
        setIsScrollingUp(true); // User is scrolling UP
      }

      // 4. Update the last scroll position for the next event
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Run on initial mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={`fixed z-50 bottom-8 right-8 flex flex-col gap-3 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {isScrollingUp ? (
        // Show Scroll to Top Button when scrolling UP
        <button
          onClick={scrollToTop}
          title="Back to Top"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E38B52] text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-[#C8742F] focus:outline-none"
          aria-label="Back to Top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      ) : (
        // Show Scroll to Bottom Button when scrolling DOWN
        <button
          onClick={scrollToBottom}
          title="Scroll to Bottom"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-[#E38B52] text-white shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-[#C8742F] focus:outline-none"
          aria-label="Scroll to Bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

const SPECIAL_EDU_QUESTIONS = {
  grossmotor: [
    "Holds head erect when in sitting or standing position (body may be supported by a person or prop).",
    "Holds head up for 5 seconds when lying on stomach to look at an object/person.",
    "Sits without support.",
    "Rolls over on flat surface.",
    "Moves from lying on stomach to a sitting position.",
    "Crawls about a room containing furniture and/or other people.",
    "Stands with support.",
    "Pulls self to standing position using person or prop for support.",
    "Stands unsupported.",
    "Walks 5 feet (may use braces or crutches).",
    "Walks upstairs and downstairs putting both feet on each step (may use wall or handrail for support).",
    "Pushes or pulls furniture for rearrangement.",
    "Runs.",
    "Squats.",
    "Walks upstairs and downstairs, alternating feet (may use wall or handrail for support).",
    "Jumps to cross an obstacle (eg. dirty water, rubbish, any floor decoration).",
    "Stands on tip toe to reach for an object at a height.",
    "Walks continuously for a period of 15 minutes.",
    "Carries own luggage to bus stand / station.",
    "Rides a bicycle (without training wheels) / swims.",
  ],
  finemotor: [
    "Closes hand around an object placed in hand.",
    "Reaches for and grasps objects.",
    "Uses both hands at the same time, when handling an object.",
    "Picks up small objects using thumb and fingers only.",
    "Makes a stack of 3 cans, or tiffin carrier containers or wooden blocks.",
    "Uses, a spoon to stir sugar / salt to mix a drink.",
    "Strings three one-inch beads or spools on to a string.",
    "Opens the door, operating door knob/latch/handle.",
    "Screws and unscrews a jar or bottle lid.",
    "Carries a filled paper cup without crushing, tipping or spilling.",
    "Tears off a perforated sheet.",
    "Places key correctly, locks and opens the lock.",
    "Pours liquid from a pitcher into a tumbler without spilling.",
    "Uses clips and safety pins.",
    "Cuts out a picture involving straight lines using scissors, from magazine of a book.",
    "Cuts out a picture involving circular lines, using scissors from a magazine.",
    "Folds a letter, fits into an envelope, applies gum to seal and puts on a stamp.",
    "Cuts/opens sachets / wrappers and empties into a container.",
    "Strikes a safety match to light a candle/lamp",
    "Threads a medium sized sewing needle within 2 tries.",
  ],
  eating: [
    "Swallows soft foods that do not require chewing.",
    "Drinks without spilling, mouthful from glass or cup with assistance.",
    "Bites required amounts of food item.",
    "Differentiates between edible and non-edible substances.",
    "Picks up dry pieces of food (biscuits) with fingers and puts food in mouth.",
    "Chews solid food",
    "Picks up a filled glass and drinks from it without spilling",
    "Uses spoon/hand to pick up and cat mixed food.",
    "Mixes food and eats with little or no spilling (may use fingers/ spoon).",
    "Eats foods, (cereal preparations) such as idli, dosai, preri, roti (Use fingers to make bits).",
    "Eats, supervised in public places without calling attention to eating behaviour.",
    "Eats porridge, payasam (milk pudding), ice cream with little or no spilling.",
    "Eats a complete meal with little or no spilling using all normal eating equipment dishes and utensils.",
    "After eating, empties plate into a trash can and washes it.",
    "Takes appropriate quantities, when food is offered.",
    "While eating, politely asks for food to be passed, and waits for others to finish.",
    "Makes necessary arrangements for and serves food in a family styles setting.",
    "Identifies drinking water in a public place and drinks it.",
    "Selects the required meal items when a variety of food is available.",
    "Orders and eats in a public dining facility.",
  ],
  dressing: [
    "Offers little or no resistance while being dressed and undressed.",
    "Extends and withdraws arms and legs as required while being dressed and undressed.",
    "Removesunbuttoned shirt/blouse, underpants and outer pants.",
    "Removes socks, banians, T Shurts/dresses, when unfastened.",
    "Puts on underpants and outer pants.",
    "Starts and closes a front zipper.",
    "Puts on shirt/blouse.",
    "Unbuttons (shirt button, press buttons, hooks).",
    "Puts on a kurta/banian/TShirt/ dress (need not fasten).",
    "Takes off ties, scarves, belts, hearing aid, spectacles or any Jewellery from self.",
    "Puts socks and shoes (any foot wear) on correct feet.",
    "Buttons clothing: (press buttons/shirt buttons/hooks).",
    "Ties a bow knot with a shoe lace/ ribbon.",
    "Puts on self-ties, scarves, belts, hearing aid, spectacles or any them of jewellery.",
    "Selects clothing appropriate to seasonal / weather conditions and to different occasions.",
    "Selects correct size, type and style of clothing at a store.",
    "Laces shoes inserting the lace in each eyelet correctly.",
    "Wears churidar with dupatia, half saree with skirt / lungi in the correct combinations. (different dress styles)",
    "Dresses self, completely.",
    "Wears dhoti / saree and manages it in the same manner the whole day (traditional dresses)",
  ],
  grooming: [
    "Offers little or no resistance while being washed.",
    "Turns head and extends hands as required while being bathed.",
    "Dries hands with a towel.",
    "Begins brushing motion for cleaning teeth (uses brush or finger).",
    "Rinses hands when told.",
    "Soaps and rinses hands.",
    "Covers mouth while sneezing, coughing and yawning.",
    "Soaps and rinses face.",
    "Uses tooth-paste or tooth powder, brushes teeth and rinses mouth.",
    "Runs a comb or brush through hair with several strokes.",
    "Blows nose, wipes drooling using a handkerchief.",
    "Bathes independently.",
    "Dries entire body with a towel after bathing.",
    "Applies face powder/deodorent/bindi (decoration on forehead)",
    "Washes, rinses and dries hair.",
    "Combs hair including oiling and plaiting (if necessary).",
    "Cleans and clips finger nails with a nail clipper.",
    "Cleans ear, using cotton buds.",
    "Shaves (male) / maintains menstrual hygiene (female)..",
    "Maintains self, clean, odour-free and groomed.",
  ],
  toileting: [
    "Stays dry for two hours",
    "Sits on the toilet for thirty seconds ",
    "Eliminates when on the toilet (bowel or bladder)",
    "Removes clothing before sitting on the toilet.",
    "Goes to the toilet when reminded",
    "Indicates by gestures or words when needed, to use the toilet.",
    "Has bowel control giving time enough to reach the toilet (after indicating)",
    "Has bladder control giving time enough to reach the toilet (after indicating)",
    "Replaces clothing before leaving the toilet.",
    "Removes clothing, sits on the toilet, eliminates and replaces clothing after washing (needs help for washing)",
    "Goes to the toilet independently",
    "Uses only a urinal or toilet for urination",
    "Flushes the toilet after use.",
    "Has bladder control at night.",
    "Closes door of toilet for normal privacy in toileting.",
    "Cleans self-using water after elimination.",
    "Obtains help for any toileting problem.",
    "Asks the location of the toilet in new situations.",
    "Washes and dries hands after toileting.",
    "Chooses the correct toilet (Men/Women) in a public place.",
  ],
  receptivelanguage: [
    "Turns head towards the source of sound.",
    'Responds by eye contact or verbal "acknowledgement when name is called.',
    'Responds to the instruction "Look at me".',
    'Obeys simple instructions such as, "Come here" and so on. ',
    'Stops an activity upon request such as "No" or "Stop".',
    'Performs the activity when the word "Me" is used such as "Give me the ball". ',
    "Identifies different sounds such as bell ringing, hands clapping, whispering, keys jingling.",
    "Responds to non verbal communication from others such as frowning, crying, smiling, etc., by returning the gesture or by giving an appropriate verbal response.",
    "Points to any common object, such as ball, spoon etc., upon request.",
    "Points to 10 body parts such as nose, eyes, mouth etc.",
    "Points to pictures of objects in a book upon request.",
    'Follows prepositions such as "Put the ball into the box" or "Put the broom behind the door".',
    "Avoids dangers when instructed to do so.",
    'Follows two-step directions in order such as, "Get the ball and close the door".',
    "Follows left and right when instructed.",
    'Follows three-step, directions such as "Stand-up", "Open the book and Move the chair".',
    "Identifies common harmful substances even if not labeled.",
    'After listening to a one-page story, indicates "Yes" or "No" to specific questions on it.',
    "Follows announcements on TV, Radio, at railway station, bus stand or airport with appropriate responses.",
    "Responds to jokes (humorous happenings at home and school), with expressions.",
  ],
  expressivelanguage: [
    "Makes voice sounds.",
    "Uses voice sounds to get attention.",
    'Says or indicates, "Yes" or "No" in response to questions.',
    "Imitates five words heard either singularly or all at once.",
    "Says 20 words.",
    "Says name when asked.",
    'Names common objects when asked, "What is this?"',
    'Names 10 body parts when asked, "What is this?"',
    'Uses two-word phrases/gestures such as, "Hello, friend", "Go out" o "Eat biscuit".',
    "Tells/indicates name and occupation of parents.",
    "Communicates address of residence and contact phone number.",
    'Expresses feelings, desires or problems in complete sentences such a "I am hungry", verbally/gesturally.',
    'Asks simple questions such as "What is this?" or "Why can`t I?" verbally/ gesturally,',
    'Uses pronouns such as "I", "You", "He", "Her", "Me" or "Mine" in complete sentence.',
    "Speaks in phrases or sentences/gestures to communicate to someone not familiar with the person.",
    "Names/indicates country, the President, Prime Minister, Chief Minister of the country.",
    "Carries on a meaningful conversation with another person(s) for 10 minutes.",
    "Describes past events in a logical order.",
    "Summarizes a T.V./Radio programme in own words",
    "Discusses current events.",
  ],
  socialinteraction: [
    "Responds when touched, by reaching towards or moving away.",
    "Looks towards or otherwise, indicates a person in the immediate area.",
    "Follows with eyes, a person moving.",
    "Plays alone with toys or objects for 2 minutes.",
    "Imitates arm movements such as dapping hands or waving goodbye.",
    "Identifies by pointing, naming, friends and acquaintances from strangers.",
    "Greets others upon meeting, either verbally or with non-verbal friendly gestures.",
    "Waits for own turn in a group.",
    'Says "Please" and "Thank you" and "Sorry".',
    "Receives guests appropriate to acquaintance (differences in the receiving. of relatives, strangers, gas/electricity men and so on).",
    "Uses items that belong to others, only with their permission.",
    "Objects/asks for help if someone uses own belongings without permission.",
    "Interacts with members of the opposite sex and members of different age groups (as required by his community).",
    "Responds using proper social courtsies on occasions such as festivals, apologizes, offers greeting or compliments as needed.",
    "Participates actively in social events by engaging in the same activity as the other members of the group.",
    "Manages/asks for help if/when teased or bullied.",
    "Receives phone calls/passes on information to the right person when given messages personally or by phone.",
    "Shares possessions with others (in classroom, home and community).",
    "Participates in group activities taking the role of a leader.",
    "Visits neighbours, relatives and friends when required",
  ],
  reading: [
    "Looks at objects presented when seated at a table.",
    "Tums the pages of a book, one at a time.",
    "Matches 10 pictures with objects.",
    "Sorts objects of 3 different shapes.",
    "Identifies names, colours (red, yellow, blue and green) when objects with those colours are presented",
    "Sort pictures of similar and/or familiar objects into the same category Eg. Animals, people, vehicles, fruits, flowers etc.",
    "Reads out functional 3 letter words.",
    "Shown 5 pictures sequentially arranged and told a story with them, pictures then jumbled up, arranges them again in sequence.",
    "When needed reads the following words and acts accordingly: Stop, Men, Women, Danger, Poison, Exit, Pull, Push, In, Out, Enter.",
    "Reads out functional two word phrases.",
    "Using price tags/price markings, identifies cost of purchases.",
    "Reads aloud, sentences with five common words.",
    "Reads a simple sentence and answers questions about it.",
    "Reads a paragraph (5 lines) and answers questions.",
    "Uses a menu card to order meals at restaurants.",
    "Reads a story to others.",
    "Reads for information or entertainment from newspapers, magazines and story books.",
    "Reads a simple story silently and states its main idea.",
    "Reads out a recipe for cooking.",
    "Reads and follows directions with objects to be assembled.",
  ],
  writing: [
    "Grasps chalk, pencil or crayon.",
    "Scribbles with chalk, pencil, or crayon.",
    "Grasps chalk, pencil or crayon for writing with thumb, index finger and middle finger.",
    "Traces with pencil or crayon along a three-inch straight line.",
    "Colours with lines.",
    "Copies with a pencil, a vertical, a horizontal or a diagonal line.",
    "Traces three circles and semi circles.",
    "Traces geometric shapes (square, rectangle, and triangle).",
    "Traces three letter functional words.",
    "Copies his name.",
    "Writes his name readably with initials or father`s name with no example to look at.",
    "Copies a printed sentence readably.",
    "Writes address and phone number readably.",
    "Copies a paragraph readably with punctuations on / to a sheet of lined paper wring on the lines",
    "Writes functional dictated words readably",
    "Writes a short sentence readably when dictated.",
    "Writes answers readably to questions after reading a paragraph.",
    "Writes a paragraph of 5 lines readably on a given topic.",
    "Writes personal letters for mailing using legible handwriting in an informal letter style.",
    "Fills / writes an application form readably.",
  ],
  numbers: [
    "Creates order out of a group of objects by lining up, stacking or placing them in some other pattern. ",
    'Indicates the difference between "more" and "less" when shown two different sized groups of objects.',
    'Separates one object from a group upon request, eg. "Give me one block".',
    'Points to "big/small" when asked.',
    'Points to "short", "long" and "tall" when asked.',
    'Chooses the correct number of objects up to 5 upon request eg. "Give me three blocks" etc.',
    "Chooses correct number of objects up to 10.",
    "Names the printed number symbols, 1 through 10 when asked at random.",
    "Performs activities according to the ordinal number (1st,2nd,3rd)eg. Forming a queue according to the number given.",
    "Writes the number symbols 1 through 10.",
    "Counts from 10 to 20.",
    "Matches the printed number symbols 1 through 100 with the correct number of objects.",
    "Does 3 line single digit addition on paper?",
    "Adds single digit numbers with sums up to 10 such as 7+3, 2+1 or 8+ 2in functional situation eg.ina purchase.",
    "Subtracts single digit addition on paper.",
    "Does two line two digit addition on paper with carry over.",
    "Does subtraction sums - two digits with borrowing on paper.",
    "Does simple two operations in a shopping situation eg, buy 2 things costing Rs. 3 and Rs.5 and balance for Rs.10.",
    "Says multiplication tables 5 and 10.",
    "Uses a simple calculator with basic four operations.",
  ],
  time: [
    "Associates the time of the day with activities such as meals time or bed time.",
    'Responds to "Now", "Later", "Hurry" and "Wait" appropriately.',
    'Answers appropriatelywhenasked, "Is it morning or afternoon, evening / night".',
    "Indicates  statingowe age.",
    "Indicates the difference between yesterday, today and tomorrow, using the terms in the correct context. ",
    "Identifies or names the 7 days of the week in a calendar.",
    'Answers/points out correctly when asked "What day of the week and date is it today".',
    "Identifies or names hour hand, minute hand and numbers on a clock.",
    "Identifies or names the 12 months of the year in a calendar.",
    'Answers/ indicates when asked "What month and year is it now.',
    "Identifies or names the seasons of the year",
    "Identifies or tells birth - date, month, day and year.",
    "Tells time by the hour on a clock.",
    "Reads time on a digital clock.",
    "Tells time by 30 minutes.",
    "Tells time to five minutes on a clock or watch",
    "Meets a particular scheduled bus.",
    "Road TV, Radios and Train schedules.",
    "Arrives on time (date and time) for any appointment (egmarriage, parties, cinema, doctors).",
    "Sets a clock to within one hour of the correct time after hearing the correct time.",
  ],
  money: [
    "Sorts coins from other small metal objects.",
    "Selects a rupee note from other paper objects.",
    "Selects 5p. 10p, 20p, 25p and 50p, 1 Rs and 2 Rs. coins from a group of coins. ",
    "Uses money to buy things (might not use correct amount).",
    "Identifies 1, 4, 5, 10, 20, 50 and 100 rupee notes.",
    "Rank orders coins and rupee notes in order of value.",
    "Exchanges 10p coins for Rs.1.",
    "Exchanges 25p coins and 50p coins for Rs.1.",
    "Exchanges 5p.coins for Rs.1.",
    "Exchanges the correct number of mixed coins for Rs.1.",
    "Exchanges the correct number of mixed coins and rupee notes for Rs.5.",
    "Uses correct amount of money for machines (weighing machine, telephone)",
    "Exchanges the correct number of mixed coins and rupee notes for Rs.50.",
    "Saves money for a purchase.",
    "Counts the change from a purchase of Rs.5 or less checking the Quantity bought.",
    "Gives an adequate amount of money for purchases up to Rs.20 checking the quantity bought and counts the change.",
    "Counts the change from a purchase up to Rs.50 checking the quantity bought.",
    "Counts change from a purchase up to Rs.100 checking the quantity bought.",
    "Selects an item comparing the prices (concept of expensive, cheap).",
    "Saves money in a bank account.",
  ],
  domesticbehaviour: [
    "Picks up household trash or litter and places it in a waste basket upon request.",
    "Puts away personal items in the proper location upon request.",
    "Dusts furniture leaving no dust on flat surfaces.",
    "Damp wipes a floor.",
    "Folds clothes and puts them in a drawer/cupboard.",
    "Makes bed, stretching, spreading, rolling, folding.",
    "Sorts vegetable/grocery items bought from market and stores them in respective containers.",
    "Sweeps a floor with a broom, picks up sweepings in a dust pan and empties the pan.",
    "Washes and dries dishes.",
    "Prepares pre-made drinks (like Rasna) when asked.",
    "Peels and cuts vegetables and fruits.",
    "Operates a grinder, mixie or grinding stone.",
    "Puts off the fire or removes cooker, cooking utensil from the fire in time.",
    "Assists in simple first aid.",
    "When required, uses a weighing machine, measuring tape or measuring cup.",
    "Prepares coffee or tea.",
    "Washes and dries clothes.",
    "Irons clothes.",
    "Does simple home repairs (such as sewing on buttons or re-joining broken seams, using needle and thread or machine, uses nail hammer, screw driver).",
    "Prepares a meal under supervision.",
  ],
  communityorientation: [
    "Performs simple errands within a familiar setting.",
    "Finds way by self from one place to another within a familiar building)",
    "Finds way from one building to another in the immediate neighbourhood.",
    "Goes to public places in a supervised group without calling unfavourable attention to self.",
    "Identifies a police man, postman, and a fireman, conductor of a bus a delivery man and telephone serviceman and persons from power supply.",
    "Interacts with strangers in public (as the situation warrants).",
    "Crosses residential street intersections, looking in both directions and waiting for traffic to clear before crossing.",
    "Walks along road that has no sidewalk - maintains left side.",
    "Responds appropriately to social kidding, teasing in public.",
    "Moves about freely in his neighbourhoodeg., school, post office, milk booth, market, place of worship.",
    "When goes out with a group, maintains the group norms.",
    'Obeys signal lights and "Walk" "Don`t walk" signals at light controlled intersections.',
    "Goes on foot or bicycle to a familiar place over half a kilometer from residence and returns.",
    "Travels independently by public bus/suburban train in a familiar route.",
    "Participates in religious activities following rules (Poga/Prayer).",
    "Leaves an awkward public situation that is beyond control and seeks help.",
    "Telephones for information or assistance when necessary.",
    "Follows directions in terms of east, west, north, south and reaches thedestination.",
    "Uses community facilities eg., hospital, railway, bus police station and post office.",
    "Casts vote.",
  ],
  recreation: [
    "Engages in a leisure-time activity for 5 minutes when materials are given.",
    "Plays simple ball games like candling, throwing, bouncing and rolling a ball.",
    "Watches TV without disturbing others.",
    "Engages in activities such as finger painting/trash painting",
    "Plays indoor games not governed by rules with others.",
    "Participates in group singing or dancing (activity or passively).",
    "Plays simple outdoor games not governed by rules eg. Sand play.",
    "Plays outdoor games involving simple rules with others.",
    "Plays indoor games, governed by simple rules.",
    "Watches TV or listens to the radio, tape recorder by selecting a station/channel turning on and off, including use of cassettes.",
    "Involves in activities such as playing with pets, or hobbies such as collection of pictures and so on.",
    "Participates in outdoor activities, swimming/ cycling / walking/ playing.",
    "Performs art and craft activities such as clay work, leather work or bead work/rangoli/kolam and so on.",
    "Initiates self-involvement in a hobby, not including reading or watching TV.",
    "Does gardening/makes flower garlands/mango leaf chain for the door.",
    "Participates in organized team sports such as cricket, basketball or volley ball.",
    "Uses community recreation facilities for recreation and leisure time activities - theatres, parks and other amusement places",
    "Participates in planning, preparing for parties and so on.",
    "Selects books from library for personal reading.",
    "Plays a musical instrument/sings (solo)",
  ],
  vocational: [
    "Assumes a body position at a task or at play such that both hands are available for use.",
    "Participates in a single activity for 10 minutes (if protected from interference).",
    "Performs a single activity under supervision, in a room with people.",
    "Assembles two-part objects that fit together in a simple but secure way.",
    "Performs an assigned task or activity for half an hour (may need motivation with rewards).",
    "Puts away own tools and materials at the end of a task (may need a reminder up to one-half of the time).",
    "Stops a task when required.",
    "Participates in group work cooperating with the other members of the group.",
    "Changes activity without showing discomfort when assigned-from one task to a different task.",
    "Accepts supervision and criticism.",
    "Goes to an assigned area without reminder in a daily routine programme.",
    "Undertakes and completes a task in order to receive money.",
    "Reads and then follows the notices, memorandums/circulars. If not able to read, asks for assistance and then follows.",
    "Reports for work on time.",
    "Increases speed of work when told to do so.",
    "Follows the sequence of activities in the routine work skill.",
    "Indicates if own performances meet the standards set for an activity.",
    "Works full time (8 hours).",
    "When situation demands, works in a team.",
    "Responds to accidents like fire, electricity, injury by informing the concerned people immediately.",
  ],
};

const SPECIAL_EDU_SKILLS = [
  { key: "grossmotor", label: "Gross Motor" },
  { key: "finemotor", label: "Fine Motor" },
  { key: "eating", label: "Eating" },
  { key: "dressing", label: "Dressing" },
  { key: "grooming", label: "Grooming" },
  { key: "toileting", label: "Toileting" },
  { key: "receptivelanguage", label: "Receptive Language" },
  { key: "expressivelanguage", label: "Expressive Language" },
  { key: "socialinteraction", label: "Social Interaction" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "numbers", label: "Numbers" },
  { key: "time", label: "Time" },
  { key: "money", label: "Money" },
  { key: "domesticbehaviour", label: "Domestic Behaviour" },
  { key: "communityorientation", label: "Community Orientation" },
  { key: "recreation", label: "Recreation" },
  { key: "vocational", label: "Vocational" },
];

const SPECIAL_EDU_ASSESSMENT_PHASES = [
  "1st assmt",
  "1st Qtr",
  "2nd Qtr",
  "3rd Qtr",
  "4th Qtr",
];

// Helper function to determine the highest filled phase for a table
const getHighestFilledPhase = (table) => {
  if (!table) return "1st assmt";

  const quarterOverrides = table.quarterOverrides || {};
  const phases = ["4th Qtr", "3rd Qtr", "2nd Qtr", "1st Qtr", "1st assmt"];

  // Check phases from highest to lowest
  for (const phase of phases) {
    if (phase === "1st assmt") {
      // 1st assessment always exists if table has rows
      if (table.rows && table.rows.length > 0) {
        return "1st assmt";
      }
    } else {
      // Quarter phases: check if there are any overrides
      const phaseOverrides = quarterOverrides[phase];
      if (phaseOverrides && Object.keys(phaseOverrides).length > 0) {
        return phase;
      }
    }
  }



  return "1st assmt"; // fallback
};

// Order of quadrants for cascaded edits
const SPECIAL_EDU_PHASE_ORDER = ['1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr'];

function getEffectiveValueForPhase(baseVal, cellKey, phase, snapshots) {
  if (!phase || phase === '1st assmt') return baseVal;

  const idx = SPECIAL_EDU_PHASE_ORDER.indexOf(phase);
  if (idx === -1) return baseVal;

  let v = baseVal;
  for (let i = 0; i <= idx; i++) {
    const p = SPECIAL_EDU_PHASE_ORDER[i];
    const map = snapshots[p];
    if (map && map[cellKey] != null) v = map[cellKey];
  }
  return v;
}

const normalizeSectionKey = (label) =>
  String(label || "")
    .toLowerCase()
    .normalize("NFKD") // remove accents
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z]/g, ""); // keep only letters

const StudentPage = () => {
  // Refs for date pickers
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const [activeTab, setActiveTab] = useState("student-details");
  const [activeCaseSection, setActiveCaseSection] = useState("identification");
  const [activeEducationSubsection, setActiveEducationSubsection] =
    useState("self-help");
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5); // show latest 5 by default
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [selectedTherapyType, setSelectedTherapyType] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);
  // AI summary related state
  const [aiSummary, setAiSummary] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState(null); // Full comprehensive analysis
  const [aiSummarizing, setAiSummarizing] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState(null);
  const [aiModel, setAiModel] = useState("meta-llama/Llama-3.3-70B-Instruct");
  const aiSummaryAbortControllerRef = useRef(null);
  const [collapsedSummarySections, setCollapsedSummarySections] = useState({});

  // Special Ed
  const fileInputRef = useRef(null);
  const [phaseSavedStatus, setPhaseSavedStatus] = useState({}); // Track which phases are saved per table
  const [savedTables, setSavedTables] = useState([]);  
  const [unsavedTableIndex, setUnsavedTableIndex] = useState(null); // Track which table has unsaved edits
  const [reportDate, setReportDate] = useState("");
  const [showTableDetails, setShowTableDetails] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePendingIndex, setDeletePendingIndex] = useState(null);
  const [tableSavedStatus, setTableSavedStatus] = useState({});
  const [questionsOpenByTable, setQuestionsOpenByTable] = useState({});
  const [activeSkillByTable, setActiveSkillByTable] = useState({});
  const [activeQuestionByTable, setActiveQuestionByTable] = useState({});
  const [pulsatingEditButton, setPulsatingEditButton] = useState({});
  const questionRefs = useRef({});
  // Guard helpers: prevent interacting with other tables while one has unsaved edits
  const isAnotherTableUnsaved = (table) =>
    unsavedTableIndex !== null &&
    savedTables[unsavedTableIndex] !== table;
  
  const warnIfUnsavedOther = (tableIndex, actionText = "open or modify another table") => {
    if (isAnotherTableUnsaved(savedTables[tableIndex])) {
      showToast(`Save the current table before ${actionText}`, "warning");
      return true;
    }
    return false;
  };

  // Translation state
  const [translating, setTranslating] = useState(false);
  const [translatedSummary, setTranslatedSummary] = useState(null);

  // Send to Parent state
  const [sendingToParent, setSendingToParent] = useState(false);
  const [sentToParent, setSentToParent] = useState(false);

  // Stored AI Summaries - for viewing later
  const [generatedSummaries, setGeneratedSummaries] = useState([]);
  const [expandedGeneratedSummaryId, setExpandedGeneratedSummaryId] = useState(null);

  const createEmptyIepData = () => ({
  selectedMonth: "",
  sections: {
    adlSkills: [],
    academic: [],
    behaviouralSkills: [],
  },
  iepStudent: "",
  remarks: "",
  signatures: {
    principal: "",
    teacher: "",
    parent: "",
  },
});

const normalizeIepData = (data = {}) => {
  if (data.sections) {
    return {
      ...createEmptyIepData(),
      ...data,
      sections: {
        adlSkills: data.sections.adlSkills || [],
        academic: data.sections.academic || [],
        behaviouralSkills: data.sections.behaviouralSkills || [],
      },
    };
  }

  const legacyRows = Array.isArray(data.tableRows) ? data.tableRows : [];
  const mapLegacy = (key) =>
    legacyRows.length
      ? legacyRows.map((row, index) => ({
          id: index + 1,
          text: row?.[key] || "",
        }))
      : [];

  return {
    ...createEmptyIepData(),
    ...data,
    sections: {
      adlSkills: mapLegacy("adlSkills"),
      academic: mapLegacy("academic"),
      behaviouralSkills: mapLegacy("behaviouralSkills"),
    },
  };
};

const [iepData, setIepData] = useState(createEmptyIepData());

  // per-month saved IEPs: { "January 2026": { ...iepData }, ... }
  const [savedIepByMonth, setSavedIepByMonth] = useState({});
  const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
  ];
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  
  const isValidYear = (() => {
    if (!selectedYear) return false;
    const num = Number(selectedYear);
    return /^\d{4}$/.test(String(selectedYear)) && num >= 1900 && num <= 2100;
  })();

  const [expandedIepMonth, setExpandedIepMonth] = useState(null);
  const [editingIepMonth, setEditingIepMonth] = useState(null);

  // Replace handleIepMonthChange with:
  const handleIepMonthChange = (month) => {
    if (iepFormVisible || editingIepMonth) {
      showToast("Save the current IEP report before changing the month.", "warning");
      return;
    }
  
    setIepData((prev) => ({
      ...createEmptyIepData(),
      selectedMonth: month,
    }));
  
    const monthYearKey = `${month} ${selectedYear}`;
    const key = `iep_data_student_${id}_by_month`;
    try {
      const mapping = JSON.parse(localStorage.getItem(key) || "{}");
      if (mapping?.[monthYearKey]) {
        setExistingIepMonthKey(monthYearKey);
        setIepFormVisible(false);
        setExpandedIepMonth(null);
        setEditingIepMonth(null);
      } else {
        setExistingIepMonthKey(null);
      }
    } catch (e) {
      console.error("Error loading month IEP:", e);
    }
  };

  const saveIepData = async () => {
    try {
      if (!iepData?.selectedMonth) {
        showToast("Please select a month before saving the IEP.", "error");
        return;
      }

      setSavingIep(true);

      const monthYearKey = editingIepMonth || `${iepData.selectedMonth} ${selectedYear}`;
      const key = `iep_data_student_${id}_by_month`;
      const mapping = JSON.parse(localStorage.getItem(key) || "{}");

      mapping[monthYearKey] = {
        ...iepData,
        selectedMonth: iepData.selectedMonth,
      };

      localStorage.setItem(key, JSON.stringify(mapping));
      setSavedIepByMonth(mapping);

      setExpandedIepMonth(monthYearKey);
      setIepFormVisible(false);
      setEditingIepMonth(null);
      setPendingNewIepMonth(null);
      setIepData((prev) => ({
        ...prev,
        selectedMonth: "",
      }));

      showToast(`IEP saved for ${monthYearKey}`, "success");
    } catch (error) {
      console.error("Error saving IEP data:", error);
      showToast("Failed to save IEP data", "error");
    } finally {
      setSavingIep(false);
    }
  };



  // Add this helper to toggle collapse/expand:
  const toggleIepExpand = (monthYearKey) => {
    if (editingIepMonth === monthYearKey) {
      showToast("Save the IEP report before collapsing it.", "warning");
      return;
    }

    if (editingIepMonth && editingIepMonth !== monthYearKey) {
      showToast("Save the IEP report you are editing before opening another.", "warning");
      return;
    }

    if (expandedIepMonth === monthYearKey) {
      setExpandedIepMonth(null);
    } else {
      setExpandedIepMonth(monthYearKey);
      const key = `iep_data_student_${id}_by_month`;
      const mapping = JSON.parse(localStorage.getItem(key) || "{}");
      if (mapping?.[monthYearKey]) {
        setIepData(normalizeIepData(savedIepByMonth[monthYearKey]));
      }
    }
  };

  // load per-month mapping on mount / when student id changes
  useEffect(() => {
    const key = `iep_data_student_${id}_by_month`;
    try {
      const mapping = JSON.parse(localStorage.getItem(key) || "{}");
      setSavedIepByMonth(mapping || {});
      // if a month is already selected, load it
      if (iepData?.selectedMonth) {
        const mKey = `${iepData.selectedMonth} ${selectedYear}`;
        if (mapping?.[mKey]) {
          setIepData(mapping[mKey]);
        }
      }
    } catch (e) {
      console.error("Failed to load IEPs by month:", e);
    }
  }, [id]);

  // Load AI summaries from localStorage on mount
  useEffect(() => {
    const summariesKey = `ai_summaries_student_${id}`;
    try {
      const stored = localStorage.getItem(summariesKey);
      if (stored) {
        const summaries = JSON.parse(stored);
        setGeneratedSummaries(Array.isArray(summaries) ? summaries : []);
      }
    } catch (e) {
      console.error("Failed to load AI summaries from localStorage:", e);
    }
  }, [id]);

  const [iepFormVisible, setIepFormVisible] = useState(false);
  const [showIepDeleteConfirm, setShowIepDeleteConfirm] = useState(false);
  const [deletePendingIepKey, setDeletePendingIepKey] = useState(null);
  const [existingIepMonthKey, setExistingIepMonthKey] = useState(null);
  const [pendingNewIepMonth, setPendingNewIepMonth] = useState(null);

  const createIepTable = () => {
    if (editingIepMonth) {
      showToast("Save or cancel the IEP report you're currently editing before creating a new one.", "warning");
      return;
    }

    if (!iepData?.selectedMonth) {
      showToast("Please select a month before creating the IEP table.", "error");
      return;
    }
    if (!selectedYear || !isValidYear) {
      showToast("Please enter the year before creating the IEP table.", "error");
      return;
    }
  
    const monthYearKey = `${iepData.selectedMonth} ${selectedYear}`;
    const storageKey = `iep_data_student_${id}_by_month`;
  
    try {
      const mapping = JSON.parse(localStorage.getItem(storageKey) || "{}");
  
      if (mapping?.[monthYearKey]) {
        setExistingIepMonthKey(monthYearKey);
        setIepFormVisible(false);
        setEditingIepMonth(null);
        setExpandedIepMonth(null);
        showToast("That IEP report already exists.", "warning");
        return;
      }
  
      const blankReport = normalizeIepData({
        ...createEmptyIepData(),
        selectedMonth: iepData.selectedMonth,
      });

      setExistingIepMonthKey(null);
      setPendingNewIepMonth(monthYearKey);
      setIepData(blankReport);
      setIepFormVisible(false);
      setExpandedIepMonth(monthYearKey);
      setEditingIepMonth(monthYearKey);
      showToast(`Created new IEP draft for ${monthYearKey}`, "success");
    } catch (e) {
      console.error("createIepTable error", e);
      showToast("Failed to initialize IEP table", "error");
    }
  };

  const confirmDeleteIepReport = (monthYearKey) => {
    setDeletePendingIepKey(monthYearKey);
    setShowIepDeleteConfirm(true);
  };

  const performDeleteIepReport = () => {
    const monthYearKey = deletePendingIepKey;
    if (!monthYearKey) return;
    const storageKey = `iep_data_student_${id}_by_month`;
    try {
      const mapping = JSON.parse(localStorage.getItem(storageKey) || "{}");
      if (mapping?.[monthYearKey]) {
        delete mapping[monthYearKey];
        localStorage.setItem(storageKey, JSON.stringify(mapping));
        setSavedIepByMonth(mapping);
        if (expandedIepMonth === monthYearKey) {
          setExpandedIepMonth(null);
          setIepFormVisible(false);
          setIepData({
            ...createEmptyIepData(),
            selectedMonth: iepData.selectedMonth,
          });
        }
        showToast(`Deleted IEP for ${monthYearKey}`, "success");
      } else {
        showToast("Report not found", "error");
      }
    } catch (err) {
      console.error("Failed to delete IEP report", err);
      showToast("Failed to delete IEP report", "error");
    } finally {
      setShowIepDeleteConfirm(false);
      setDeletePendingIepKey(null);
    }
  };

  const [savingIep, setSavingIep] = useState(false);

  

  // Handle sending AI summary to parent
  const handleSendToParent = async () => {
    if (!aiAnalysis?.summary) return;
    setSendingToParent(true);
    setSentToParent(false);
    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const studentId = student?.studentId || id;
      const payload = {
        student_id: studentId,
        title: `Progress Summary - ${student?.name || studentId}`,
        message: "A new AI-generated progress summary is available for your child.",
        report_summary: translatedSummary || aiAnalysis.summary,
        report_from_date: fromDate || null,
        report_to_date: toDate || null,
        therapy_type: selectedTherapyType || null,
      };
      const res = await fetch(`${baseUrl}/api/v1/notifications/send-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to send report to parent");
      }
      setSentToParent(true);
      setTimeout(() => setSentToParent(false), 4000);
    } catch (err) {
      console.error("Send to parent error:", err);
      alert(err.message || "Failed to send report to parent");
    } finally {
      setSendingToParent(false);
    }
  };

  // Handle translation - always translates to Malayalam
  const handleTranslate = async () => {
    setTranslating(true);

    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      const summaryText = aiAnalysis?.summary || "";

      if (!summaryText.trim()) {
        throw new Error(
          "No AI summary available to translate. Please generate AI summary first.",
        );
      }

      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const res = await fetch(`${baseUrl}/api/v1/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: summaryText,
          target_language: "mal_Mlym",
          source_language: "eng_Latn",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Translation failed: ${res.status}`,
        );
      }

      const data = await res.json();
      setTranslatedSummary(data.translated_text);
    } catch (e) {
      alert(`Translation failed: ${e.message}`);
      setTranslatedSummary(null);
    } finally {
      setTranslating(false);
    }
  };

  // IEP Functions
  const handleIepInputChange = (field, value) => {
    setIepData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleIepSectionChange = (sectionKey, itemId, value) => {
    setIepData((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: (prev.sections?.[sectionKey] || []).map((item) =>
          item.id === itemId ? { ...item, text: value } : item,
        ),
      },
    }));
  };
  
  const addIepSectionItem = (sectionKey) => {
    setIepData((prev) => {
      const currentItems = prev.sections?.[sectionKey] || [];
      const nextId =
        currentItems.length > 0
          ? Math.max(...currentItems.map((item) => item.id)) + 1
          : 1;
  
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionKey]: [...currentItems, { id: nextId, text: "" }],
        },
      };
    });
  };
  
  const removeIepSectionItem = (sectionKey, itemId) => {
    setIepData((prev) => {
      const currentItems = prev.sections?.[sectionKey] || [];
      if (currentItems.length === 0) return prev;
  
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionKey]: currentItems.filter((item) => item.id !== itemId),
        },
      };
    });
  };

  const handleSignatureChange = (signatureType, value) => {
    setIepData((prev) => ({
      ...prev,
      signatures: {
        ...prev.signatures,
        [signatureType]: value,
      },
    }));
  };


  const handleQuarterEditDateChange = (targetTable, quarterPhase, value) => {
    if (!targetTable) return;

    const nowIso = new Date().toISOString();

    setSavedTables((prev) => {
      const updated = prev.map((t) => {
        if (t !== targetTable) return t;

        return {
          ...t,
          quarterEditDates: {
            ...(t.quarterEditDates || {}),
            [quarterPhase]: value,
          },
          last_edited_at: nowIso,
        };
      });

      try {
        if (typeof window !== "undefined" && id) {
          window.localStorage.setItem(
            `special-education-tables:${id}`,
            JSON.stringify(updated),
          );
        }
      } catch (err) {
        console.warn("Failed to persist quarter edit date", err);
      }

      return updated;
    });
  };
  

  const loadIepData = () => {
    try {
      const key = `iep_data_student_${id}_by_month`;
      const mapping = JSON.parse(localStorage.getItem(key) || "{}");
      setSavedIepByMonth(mapping || {});
      // if a month is selected, load that month
      if (iepData?.selectedMonth && mapping?.[iepData.selectedMonth]) {
        setIepData(mapping[iepData.selectedMonth]);
      }
    } catch (error) {
      console.error("Error loading IEP data:", error);
    }
  };



// add a new row where only `columnKey` is intended to be edited (other cells empty)
const addCellToColumn = (columnKey) => {
  setIepData(prev => {
    const sections = { ...prev.sections };
    const list = [...(sections[columnKey] || [])];
    const nextId = (list[list.length - 1]?.id || 0) + 1;
    list.push({ id: nextId, text: "" });
    sections[columnKey] = list;
    return { ...prev, sections };
  });
};

  const downloadIepAsPDF = (iepSource = iepData) => {
    if (iepFormVisible || editingIepMonth) {
      showToast("Please save or cancel the open IEP edit before downloading.", "error");
      return;
    }
  
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    // --- Layout & sizing tweaks: larger table, padding above title, moved components ---
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    
    // add padding above main heading
    const titleTopPadding = 20;
    const titleY = margin + titleTopPadding;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(
      `TRIMESTER REPORT OF ${String(iepData?.selectedMonth || "").toUpperCase()}`,
      pageW / 2,
      titleY,
      { align: "center" }
    );
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Name : ${student?.name || ""}`, margin, titleY + 20);
    
    // table sizing: larger overall table
    const tableTop = titleY + 44; // increased gap under name/title
    const tableLeft = margin;
    const tableWidth = pageW - margin * 2;
    const colWidth = Math.floor(tableWidth / 3);
    
    const cellPadding = 6; // consistent padding
    const usableColW = colWidth - cellPadding * 2;
    const lineHeight = 12;
    const headerH = 26;
    const minRowH = 28; // slightly taller rows for readability
    
    // build row data from the three columns (safe string conversion)
    const adl = iepData?.sections?.adlSkills || [];
    const academic = iepData?.sections?.academic || [];
    const behavioural = iepData?.sections?.behaviouralSkills || [];
    const rowsCount = Math.max(adl.length, academic.length, behavioural.length, 3); // ensure some rows
    
    const rowHeights = [];
    const rowTextLines = [];
    
    for (let r = 0; r < rowsCount; r++) {
      const c0 = String(adl[r]?.text ?? "");
      const c1 = String(academic[r]?.text ?? "");
      const c2 = String(behavioural[r]?.text ?? "");
    
      const l0 = doc.splitTextToSize(c0, usableColW);
      const l1 = doc.splitTextToSize(c1, usableColW);
      const l2 = doc.splitTextToSize(c2, usableColW);
    
      const rh = Math.max(
        Math.max(l0.length, l1.length, l2.length) * lineHeight + cellPadding * 2,
        minRowH
      );
      rowHeights.push(rh);
      rowTextLines.push([l0, l1, l2]);
    }
    
    const tableBodyHeight = rowHeights.reduce((a, b) => a + b, 0);
    const tableHeight = headerH + tableBodyHeight;
    
    // draw outer table border (bigger table)
    doc.setLineWidth(0.8);
    doc.rect(tableLeft, tableTop, tableWidth, tableHeight, "S");
    
    // draw vertical dividers
    const x1 = tableLeft + colWidth;
    const x2 = tableLeft + colWidth * 2;
    doc.line(x1, tableTop, x1, tableTop + tableHeight);
    doc.line(x2, tableTop, x2, tableTop + tableHeight);
    
    // header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const headerTitles = ["ADL SKILLS", "ACADEMIC SKILLS", "BEHAVIOURAL SKILLS"];
    for (let i = 0; i < 3; i++) {
      const hx = tableLeft + i * colWidth + cellPadding;
      const hy = tableTop + headerH / 2 + 4;
      doc.text(headerTitles[i], hx, hy);
    }

        // draw horizontal line under header
    doc.setLineWidth(0.7);
    doc.line(tableLeft, tableTop + headerH, tableLeft + tableWidth, tableTop + headerH);
    
    // render rows
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let y = tableTop + headerH;
    for (let r = 0; r < rowsCount; r++) {
      const rh = rowHeights[r];
      const lines = rowTextLines[r];
    
      for (let c = 0; c < 3; c++) {
        const x = tableLeft + c * colWidth + cellPadding;
        // top-aligned inside row with a small top offset
        doc.text(lines[c], x, y + cellPadding + 6);
      }
      y += rh;
    }
    
    // gap after table
    y += 18;
    
    // IEP label + REMARKS (moved accordingly)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("IEP OF THE STUDENT :", margin, y);
    y += 80;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("REMARKS :", margin, y);
    y += 10;
    
    // increased remarks box height
    const remarksBoxHeight = 140; // adjust as needed
    const remarksBoxWidth = tableWidth;
    doc.rect(margin, y, remarksBoxWidth, remarksBoxHeight);
    
    // write remarks text inside box with small left padding
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const remarksText = String(iepSource?.remarks || "");
    const remarksLines = doc.splitTextToSize(remarksText, remarksBoxWidth - cellPadding * 2);
    doc.text(remarksLines, margin + cellPadding, y + 12);
    
    y += remarksBoxHeight + 26; // move cursor below box
    
    // signatures (computed after remarks box so they sit beneath it)
    const sigW = Math.floor(tableWidth / 3);
    const sigX0 = margin;
    const sigX1 = margin + sigW;
    const sigX2 = margin + sigW * 2;
    const sigLineY = y + 18;
    const sigLineLength = sigW - 40;
    
    doc.setLineWidth(0.7);
    doc.line(sigX0 + 20, sigLineY, sigX0 + 20 + sigLineLength, sigLineY);
    doc.line(sigX1 + 20, sigLineY, sigX1 + 20 + sigLineLength, sigLineY);
    doc.line(sigX2 + 20, sigLineY, sigX2 + 20 + sigLineLength, sigLineY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Principal", sigX0 + 20, sigLineY + 14);
    doc.text("Class Teacher", sigX1 + 20, sigLineY + 14);
    doc.text("Parent / Guardian", sigX2 + 20, sigLineY + 14);
  
    // Save PDF
    doc.save(`${(student?.name || "student").replace(/\s+/g, "_")}-iep.pdf`);
  };

  const renderSummaryContent = (summaryText, isStreaming = false) => {
    const text = String(summaryText || "").trim();

    if (!text) {
      return (
        <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4 text-sm text-gray-700">
          <div className="font-semibold text-[#C56930]">Generating summary...</div>
          <div className="mt-1 text-gray-600">
            The AI is preparing a structured progress summary from the selected reports.
          </div>
        </div>
      );
    }

    const lines = text.split("\n");
    const sections = [];
    let summaryTitle = selectedTherapyType || "Therapy";
    let currentSection = { heading: "Summary", lines: [] };

    const pushSection = () => {
      const hasContent = currentSection.lines.some((line) => (line || "").trim().length > 0);
      if (hasContent) {
        sections.push(currentSection);
      }
    };

    lines.forEach((rawLine) => {
      const line = (rawLine || "").trim();

      if (!line) {
        currentSection.lines.push("");
        return;
      }

      const cleanedHeading = line.replace(/^\*\*|\*\*$/g, "").trim();
      const isMainTitle = /progress summary/i.test(cleanedHeading);
      const isSectionHeading =
        (line.startsWith("**") && line.endsWith("**")) ||
        (/^[A-Z][^:]{2,80}:$/.test(cleanedHeading) && !isMainTitle);

      if (isMainTitle) {
        const titleWithoutSuffix = cleanedHeading
          .replace(/\s*[Ã¯Â¿Â½-]\s*progress summary\s*$/i, "")
          .replace(/\s*progress summary\s*$/i, "")
          .trim();
        summaryTitle = titleWithoutSuffix || summaryTitle;
        return;
      }

      if (isSectionHeading) {
        pushSection();
        currentSection = {
          heading: cleanedHeading.replace(/:$/, ""),
          lines: [],
        };
        return;
      }

      currentSection.lines.push(line);
    });

    pushSection();

    return (
      <div className="space-y-3">
        <div className="mb-2 rounded-xl border border-[#E38B52]/40 bg-gradient-to-r from-orange-100 to-orange-50 px-4 py-3">
          <div className="text-lg sm:text-xl font-extrabold text-[#B85D2A] tracking-wide uppercase">
            {summaryTitle}
          </div>
        </div>

        {sections.map((section, sectionIndex) => {
          const sectionKey = `${section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${sectionIndex}`;
          const isCollapsed = !!collapsedSummarySections[sectionKey];

          return (
            <div key={sectionKey} className="rounded-xl border border-orange-200/70 bg-white/90">
              <button
                type="button"
                onClick={() =>
                  setCollapsedSummarySections((prev) => ({
                    ...prev,
                    [sectionKey]: !prev[sectionKey],
                  }))
                }
                className="w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left hover:bg-orange-50/70 transition-colors"
              >
                <h5 className="text-sm sm:text-base font-bold text-[#B65E2A]">
                  {section.heading}
                </h5>
                <span className="text-[#E38B52] text-xs font-semibold">
                  {isCollapsed ? "Expand" : "Collapse"}
                </span>
              </button>

              {!isCollapsed && (
                <div className="mt-1 px-4 pb-4 space-y-3">
                  {section.lines.map((sectionLine, lineIndex) => {
                    const line = (sectionLine || "").trim();
                    if (!line) {
                      return <div key={`${sectionKey}-spacer-${lineIndex}`} className="h-2" />;
                    }

                    const isBullet = /^[-Ã¯Â¿Â½*]\s+/.test(line);
                    const bulletText = isBullet ? line.replace(/^[-Ã¯Â¿Â½*]\s+/, "") : line;
                    const isFinalVisibleLine =
                      isStreaming &&
                      sectionIndex === sections.length - 1 &&
                      lineIndex === section.lines.length - 1;

                    return (
                      <div
                        key={`${sectionKey}-line-${lineIndex}`}
                        className={`rounded-lg px-3 py-2 ${
                          isBullet
                            ? "bg-white/80 border border-orange-100"
                            : "bg-transparent"
                        }`}
                      >
                        <p className="text-sm sm:text-[15px] text-gray-800 leading-7">
                          {isBullet && <span className="text-[#E38B52] font-bold mr-2">Ã¯Â¿Â½</span>}
                          {bulletText}
                          {isFinalVisibleLine && (
                            <span className="inline-block ml-1 text-[#E38B52] font-semibold animate-pulse">
                              |
                            </span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getFilteredReportsForCurrentFilters = () => {
    return reports.filter((r) => {
      if (fromDate) {
        if (!r.report_date) return false;
        const reportDate = new Date(r.report_date);
        const filterFromDate = new Date(fromDate);
        if (reportDate < filterFromDate) return false;
      }
      if (toDate) {
        if (!r.report_date) return false;
        const reportDate = new Date(r.report_date);
        const filterToDate = new Date(toDate);
        if (reportDate > filterToDate) return false;
      }
      if (selectedTherapyType) {
        if (!r.therapy_type || r.therapy_type.trim() !== selectedTherapyType.trim()) {
          return false;
        }
      }
      return true;
    });
  };

  const normalizeAIProgressSummary = (summary) => {
    return String(summary || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  };

  const handleAISummarize = async () => {
    setAiSummaryError(null);
    setAiSummary("");
    setAiAnalysis(null);
    setTranslatedSummary(null);
    setCollapsedSummarySections({});
    // Build server payload based on current filters
    const payload = {
      student_id: student?.studentId || id,
      from_date: fromDate || null,
      to_date: toDate || null,
      therapy_type: selectedTherapyType || null,
      model: aiModel,
      max_length: 280,
      min_length: 60,
    };
    if (!payload.student_id) {
      setAiSummaryError("Missing student id");
      return;
    }
    setAiSummarizing(true);
    const abortController = new AbortController();
    aiSummaryAbortControllerRef.current = abortController;
    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/api/v1/therapy-reports/summary/ai/stream`, {
        method: "POST",
        signal: abortController.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${text}`);
      }

      if (!res.body) {
        throw new Error("Streaming response body is not available");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedSummary = "";
      let gotCompleteEvent = false;

      const processSseEvent = (rawEvent) => {
        if (!rawEvent) return;

        const lines = rawEvent
          .split("\n")
          .map((line) => line.trimEnd())
          .filter(Boolean);
        if (!lines.length) return;

        let eventType = "message";
        const dataLines = [];

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          }
        }

        const dataText = dataLines.join("\n");
        if (!dataText) return;

        let parsed;
        try {
          parsed = JSON.parse(dataText);
        } catch {
          return;
        }

        if (eventType === "summary") {
          const nextChunk = parsed?.chunk || "";
          if (nextChunk) {
            streamedSummary += nextChunk;
            setAiSummary(streamedSummary);
          }
          return;
        }

        if (eventType === "summary_replace") {
          const replacement = parsed?.summary || "";
          streamedSummary = replacement;
          setAiSummary(replacement);
          return;
        }

        if (eventType === "complete") {
          gotCompleteEvent = true;
          const normalizedSummary = normalizeAIProgressSummary(parsed?.summary || streamedSummary || "");
          const normalizedData = { ...parsed, summary: normalizedSummary };
          setAiAnalysis(normalizedData);
          setAiSummary(normalizedSummary || "(No summary returned)");
          
          // Save to generated summaries for viewing later
          const newSummary = {
            id: Date.now(),
            summary: normalizedSummary,
            dateRange: {
              start: fromDate || "All dates",
              end: toDate || "Current",
            },
            therapyType: selectedTherapyType || "All therapies",
            reportCount: parsed?.used_reports || 0,
            generatedAt: new Date().toLocaleString(),
          };
          setGeneratedSummaries(prev => {
            const updated = [newSummary, ...prev];
            // Also save to localStorage
            const summariesKey = `ai_summaries_student_${id}`;
            try {
              localStorage.setItem(summariesKey, JSON.stringify(updated));
            } catch (e) {
              console.error("Failed to save AI summaries to localStorage:", e);
            }
            return updated;
          });
          return;
        }

        if (eventType === "error") {
          throw new Error(parsed?.message || "AI summary streaming failed");
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            processSseEvent(buffer.trim());
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const evt of events) {
          processSseEvent(evt.trim());
        }
      }

      if (!gotCompleteEvent) {
        throw new Error("AI summary stream closed before completion");
      }
    } catch (e) {
      if (e?.name === "AbortError") {
        setAiSummaryError("Generation stopped");
        return;
      }
      console.error("AI summarize failed", e);
      setAiSummaryError(e.message);
    } finally {
      aiSummaryAbortControllerRef.current = null;
      setAiSummarizing(false);
    }
  };

  const handleStopAISummarize = () => {
    if (aiSummaryAbortControllerRef.current) {
      aiSummaryAbortControllerRef.current.abort();
    }
  };

  // PDF generation for AI Analysis Report
  const generateAIAnalysisPDF = () => {
    if (!aiAnalysis || !student) {
      alert("No AI analysis data available to export");
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const marginLeft = 20;
    const marginRight = 20;
    const contentWidth = pageWidth - marginLeft - marginRight;
    let yPosition = 20;

    // Helper function to add text with word wrapping
    const addWrappedText = (text, x, y, maxWidth, lineHeight = 5) => {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + lines.length * lineHeight;
    };

    // Header
    pdf.setFontSize(18);
    pdf.setFont(undefined, "bold");
    pdf.text("AI Therapy Analysis Report", marginLeft, yPosition);
    yPosition += 10;

    // Student Information
    pdf.setFontSize(12);
    pdf.setFont(undefined, "normal");
    pdf.text(`Student: ${student.name || "N/A"}`, marginLeft, yPosition);
    yPosition += 7;
    pdf.text(
      `Student ID: ${student.student_id || "N/A"}`,
      marginLeft,
      yPosition,
    );
    yPosition += 7;
    if (student.class_name) {
      pdf.text(`Class: ${student.class_name}`, marginLeft, yPosition);
      yPosition += 7;
    }
    pdf.text(
      `Reports Analyzed: ${aiAnalysis.used_reports || 0}`,
      marginLeft,
      yPosition,
    );
    yPosition += 7;
    if (aiAnalysis.date_range) {
      pdf.text(
        `Analysis Period: ${aiAnalysis.date_range.start_date || "N/A"} to ${aiAnalysis.date_range.end_date || "N/A"}`,
        marginLeft,
        yPosition,
      );
      yPosition += 10;
    }

    // PROGRESS SUMMARY - Main consolidated report
    if (aiAnalysis.summary) {
      pdf.setFontSize(16);
      pdf.setFont(undefined, "bold");
      pdf.text("PROGRESS SUMMARY", marginLeft, yPosition);
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont(undefined, "normal");

      // Split the summary text and handle page breaks
      const summaryLines = pdf.splitTextToSize(
        aiAnalysis.summary,
        contentWidth,
      );
      summaryLines.forEach((line) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, marginLeft, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, marginLeft, 285);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 40, 285);
    }

    // Save the PDF
    const fileName = `AI_Analysis_Report_${student.student_id || "Unknown"}_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(fileName);
  };

  const [editMode, setEditMode] = useState(false);
  const [teacherUsers, setTeacherUsers] = useState([]);
  const [editData, setEditData] = useState(null);
  const [householdRows, setHouseholdRows] = useState([
    {
      id: 1,
      name: "",
      age: "",
      education: "",
      occupation: "",
      health: "",
      income: "",
    },
  ]);
  const [drugRows, setDrugRows] = useState([{ id: 1, name: "", dose: "" }]);
  const [aadharEditError, setAadharEditError] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Document upload states
  const [documents, setDocuments] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadedDocTypes, setUploadedDocTypes] = useState({});
    const [showDocumentDeleteConfirm, setShowDocumentDeleteConfirm] = useState(false);
  const [pendingDocumentDelete, setPendingDocumentDelete] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
    const SPECIAL_DOC_TYPES = ["aadhar", "birth_certificate", "ration_card"];
        
    
    const DOCUMENT_TYPE_LABELS = {
      aadhar: "Aadhar",
      birth_certificate: "Birth Certificate",
      disability_certificate: "Disability Certificate",
      ration_card: "Ration Card",
      unique_disability: "UDID Card",
      hospital_assessment: "Medical Reports",
      passbook: "Passbook",
      nish_assessment: "Assessment Report",
    };
  const DOCUMENT_UPLOAD_RESET_MS = 3000;
  const documentUploadTimersRef = useRef({});
  
  const clearDocumentUploadTimer = (docTypeId) => {
    const timer = documentUploadTimersRef.current[docTypeId];
    if (timer) {
      clearTimeout(timer);
      delete documentUploadTimersRef.current[docTypeId];
    }
  };
  
  const syncUploadedDocTypesFromDocuments = (docs = []) => {
    const next = {};
    docs.forEach((doc) => {
      const docTypeId = doc.documentType || doc.document_type || doc.type;
      if (docTypeId && SPECIAL_DOC_TYPES.includes(docTypeId)) {
        next[docTypeId] = true;
      }
    });
    setUploadedDocTypes(next);
  };
  const documentInputRef = useRef(null);

    const [uploadedDocumentsByType, setUploadedDocumentsByType] = useState({});
  
  const getDocumentTypeId = (doc) =>
    doc?.documentType || doc?.document_type || doc?.type || "";

  const getDocumentLabel = (doc) =>
    doc?.documentLabel || doc?.document_label || DOCUMENT_TYPE_LABELS[getDocumentTypeId(doc)] || getDocumentTypeId(doc) || "Document";

  const getDocumentCategoryLabel = (doc) =>
    doc?.documentLabel || doc?.document_label || DOCUMENT_TYPE_LABELS[getDocumentTypeId(doc)] || "";

  const getDocumentMimeType = (doc) =>
    (doc?.content_type || doc?.mime_type || "application/pdf").toLowerCase();

  const getDocumentGroupLabel = (doc) =>
    getDocumentCategoryLabel(doc) || "Other Documents";
  
  const syncUploadedDocumentsByType = (docs = []) => {
    const next = {};
  
    docs.forEach((doc) => {
      const typeId = getDocumentTypeId(doc);
      if (!typeId) return;
  
      if (!next[typeId]) next[typeId] = [];
      next[typeId].push(doc);
    });
  
    setUploadedDocumentsByType(next);
  
    setUploadedDocTypes(
      SPECIAL_DOC_TYPES.reduce((acc, typeId) => {
        acc[typeId] = !!next[typeId]?.length;
        return acc;
      }, {}),
    );
  };

  const documentsByCategory = documents.reduce((groups, doc) => {
    const categoryLabel = getDocumentCategoryLabel(doc) || "Other Documents";
    if (!groups[categoryLabel]) {
      groups[categoryLabel] = [];
    }
    groups[categoryLabel].push(doc);
    return groups;
  }, {});

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Toast notification helper
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 4000);
  };

  const caseRecordCompletion = React.useMemo(() => {
    if (!student) return 0; // Define the key fields that constitute a "complete" case record
    const fieldsToCheck = [
      student.bloodGroup,
      student.category,
      student.informantName,
      student.presentComplaints,
      student.previousTreatments,
      student.totalFamilyIncome,
      student.household?.length > 0, // Check if there are any household members
      Object.keys(student.familyHistory || {}).length > 0, // Check for any family history
      Object.keys(student.birthHistory || {}).length > 0,
      Object.keys(student.developmentHistory || {}).length > 0,
      Object.keys(student.assessment || {}).length > 0,
    ];

    const completedFields = fieldsToCheck.filter((field) => {
      if (typeof field === "boolean") return field === true;
      return field; // This checks for non-empty strings, non-zero numbers, etc.
    }).length;

    const totalFields = fieldsToCheck.length;
    if (totalFields === 0) return 100;

    const percentage = Math.round((completedFields / totalFields) * 100);
    return percentage;
  }, [student]); // This calculation re-runs only when the 'student' object changes

  // Start editing: initialize editData
  const handleEditStart = () => {
    if (student) {
      setHouseholdRows(normalizeHouseholdRows(student.household));
      setDrugRows(normalizeDrugRows(student.drug_history));
    }
    setEditMode(true);
  };

  const createEmptyHouseholdRow = (id) => ({
    id,
    name: "",
    age: "",
    education: "",
    occupation: "",
    health: "",
    income: "",
  });

  const createEmptyDrugRow = (id) => ({
    id,
    name: "",
    dose: "",
  });

  const normalizeHouseholdRows = (rows = []) => {
    const normalizedRows = rows.map((row, index) => ({
      id: index + 1,
      name: row?.name || "",
      age: row?.age || "",
      education: row?.education || "",
      occupation: row?.occupation || "",
      health: row?.health || "",
      income: row?.income || "",
    }));

    return normalizedRows.length ? normalizedRows : [createEmptyHouseholdRow(1)];
  };

  const normalizeDrugRows = (rows = []) => {
    const normalizedRows = rows.map((row, index) => ({
      id: index + 1,
      name: row?.name || "",
      dose: row?.dose || "",
    }));

    return normalizedRows.length ? normalizedRows : [createEmptyDrugRow(1)];
  };

  useEffect(() => {
    if (!student) return;
    setHouseholdRows(normalizeHouseholdRows(student.household));
    setDrugRows(normalizeDrugRows(student.drug_history));
  }, [student]);

  const updateHouseholdRow = (rowId, field, value) => {
    setHouseholdRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  };

  const addHouseholdRow = () => {
    setHouseholdRows((prev) => [
      ...prev,
      createEmptyHouseholdRow(prev.length + 1),
    ]);
  };

  const removeHouseholdRow = (rowId) => {
    setHouseholdRows((prev) => {
      const remainingRows = prev
        .filter((row) => row.id !== rowId)
        .map((row, index) => ({ ...row, id: index + 1 }));

      return remainingRows.length ? remainingRows : [createEmptyHouseholdRow(1)];
    });
  };

  const updateDrugRow = (rowId, field, value) => {
    setDrugRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  };

  const addDrugRow = () => {
    setDrugRows((prev) => [...prev, createEmptyDrugRow(prev.length + 1)]);
  };

  const removeDrugRow = (rowId) => {
    setDrugRows((prev) => {
      const remainingRows = prev
        .filter((row) => row.id !== rowId)
        .map((row, index) => ({ ...row, id: index + 1 }));

      return remainingRows.length ? remainingRows : [createEmptyDrugRow(1)];
    });
  };

  const developmentHistoryMap = {
    "Smiles at other": "smiles_at_other",
    "Head Control": "head_control",
    Sitting: "sitting",
    "Responds to name": "responds_to_name",
    Babbling: "babbling",
    "First words": "first_words",
    Standing: "standing",
    Walking: "walking",
    "Two word phrases": "two_word_phrases",
    "Toilet control": "toilet_control",
    Sentences: "sentences",
    "Physical Deformity": "physical_deformity",
  };

  const setNestedEditValue = (target, path, value) => {
    const keys = path.split(".");
    const nextTarget = { ...(target || {}) };
    let cursor = nextTarget;

    for (let index = 0; index < keys.length - 1; index += 1) {
      const key = keys[index];
      const currentValue = cursor[key];
      cursor[key] =
        currentValue && typeof currentValue === "object"
          ? Array.isArray(currentValue)
            ? [...currentValue]
            : { ...currentValue }
          : {};
      cursor = cursor[key];
    }

    cursor[keys[keys.length - 1]] = value;
    return nextTarget;
  };

  // Handle input change in edit mode
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Prevent editing studentId
    if (name === "studentId") return;

    if (type === "checkbox") {
      if (name.includes(".")) {
        setEditData((prev) => setNestedEditValue(prev, name, checked));
        return;
      }

      setEditData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    // Special handling for Aadhaar formatting/validation
    if (name === "aadharNumber") {
      const raw = String(value || "");
      const digits = raw.replace(/\D/g, "").slice(0, 12);
      const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
      setEditData((prev) => ({ ...prev, [name]: formatted }));

      if (digits.length !== 12) {
        setAadharEditError("Aadhaar must be exactly 12 digits.");
      } else if (/^[01]/.test(digits)) {
        setAadharEditError("Aadhaar must start with a digit between 2 and 9.");
      } else {
        setAadharEditError("");
      }
      return;
    }

    // IFSC: uppercase letters, no spaces, max 11 chars
    if (name === "ifscCode") {
      const v = String(value || "")
        .replace(/\s+/g, "")
        .toUpperCase()
        .slice(0, 11);
      setEditData((prev) => ({ ...prev, [name]: v }));
      return;
    }

    if (name.includes(".")) {
      setEditData((prev) => setNestedEditValue(prev, name, value));
      return;
    }

    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSelectChange = (fieldName) => (e) => {
    handleEditChange(e);

    if (fieldName === "class" && !e.target.value) {
      setEditData((prev) => ({ ...prev, division: "" }));
    }
  };

  // Cancel editing
  const handleEditCancel = () => {
    // Remove non-editable fields from student state for editData
    if (!student) return;
    // Only include editable fields
    const {
      studentId,
      photoUrl,
      address, // non-editable
      ...editableFields
    } = student;
    setEditData(editableFields);
    setHouseholdRows(normalizeHouseholdRows(student.household));
    setDrugRows(normalizeDrugRows(student.drug_history));
    setEditMode(false);
  };

  // Save changes
  const handleEditSave = async () => {
    try {
      // Prevent saving when Aadhaar validation failed
      if (aadharEditError) {
        alert(aadharEditError || "Invalid Aadhaar number");
        return;
      }
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

      // This payload correctly maps your form state to what the API expects
      const payload = {
        name: editData.name,
        age: editData.age,
        dob: editData.dob,
        gender: editData.gender,
        religion: editData.religion,
        caste: editData.caste,
        class_name: editData.class,
        roll_no: editData.rollNo,
        division: editData.division,
        birth_place: editData.birthPlace,
        house_name: editData.houseName,
        street_name: editData.streetName,
        post_office: editData.postOffice,
        pin_code: editData.pinCode,
        revenue_district: editData.revenueDistrict,
        block_panchayat: editData.blockPanchayat,
        local_body: editData.localBody,
        taluk: editData.taluk,
        phone_number: editData.phoneNumber,
        email: editData.email,
        father_name: editData.fatherName,
        father_education: editData.fatherEducation,
        father_occupation: editData.fatherOccupation,
        mother_name: editData.motherName,
        mother_education: editData.motherEducation,
        mother_occupation: editData.motherOccupation,
        guardian_name: editData.guardianName,
        guardian_relationship: editData.guardianRelationship,
        guardian_contact: editData.guardianContact,
        guardian_occupation: editData.guardianOccupation,
        total_family_income: editData.totalFamilyIncome,
        academic_year: editData.academicYear,
        admission_number: editData.admissionNumber,
        admission_date: editData.admissionDate,
        // class_teacher removed; derive teacher via class_name + division
        bank_name: editData.bankName,
        account_number: editData.accountNumber,
        branch: editData.branch,
        ifsc_code: editData.ifscCode,
        disability_type: editData.disabilityType,
        disability_percentage: editData.disabilityPercentage,
        identification_marks: editData.identificationMarks,
        aadhar_number: editData.aadharNumber
          ? String(editData.aadharNumber).replace(/\s+/g, "")
          : null,
        ud_id: editData.ud_id,
        blood_group: editData.bloodGroup,
        category: editData.category,
        // Case record specific fields
        informant_name: editData.informantName,
        informant_relationship: editData.informantRelationship,
        duration_of_contact: editData.durationOfContact,
        present_complaints: editData.presentComplaints,
        previous_treatments: editData.previousTreatments,
        // Family History
        family_history_mental_illness: editData.familyHistory?.mental_illness,
        family_history_mental_retardation:
          editData.familyHistory?.mental_retardation,
        family_history_epilepsy: editData.familyHistory?.epilepsy,
        // Birth History
        prenatal_history: editData.birthHistory?.prenatal,
        natal_history: editData.birthHistory?.natal,
        postnatal_history: editData.birthHistory?.postnatal,
        // Development History
        smiles_at_other: editData.developmentHistory?.smiles_at_other,
        head_control: editData.developmentHistory?.head_control,
        sitting: editData.developmentHistory?.sitting,
        responds_to_name: editData.developmentHistory?.responds_to_name,
        babbling: editData.developmentHistory?.babbling,
        first_words: editData.developmentHistory?.first_words,
        standing: editData.developmentHistory?.standing,
        walking: editData.developmentHistory?.walking,
        two_word_phrases: editData.developmentHistory?.two_word_phrases,
        toilet_control: editData.developmentHistory?.toilet_control,
        sentences: editData.developmentHistory?.sentences,
        physical_deformity: editData.developmentHistory?.physical_deformity,
        // Additional Info
        school_history: editData.additionalInfo?.school_history,
        occupational_history: editData.additionalInfo?.occupational_history,
        behaviour_problems:
          editData.assessment?.behaviour_problems ||
          editData.additionalInfo?.behaviour_problems,
        // Assessment - Self Help
        eating_habits: editData.assessment?.self_help?.food_habits?.eating,
        drinking_habits: editData.assessment?.self_help?.food_habits?.drinking,
        toilet_habits: editData.assessment?.self_help?.toilet_habits,
        brushing: editData.assessment?.self_help?.brushing,
        bathing: editData.assessment?.self_help?.bathing,
        dressing_removing_wearing:
          editData.assessment?.self_help?.dressing?.removing_and_wearing,
        dressing_buttoning: editData.assessment?.self_help?.dressing?.buttoning,
        dressing_footwear: editData.assessment?.self_help?.dressing?.footwear,
        dressing_grooming: editData.assessment?.self_help?.dressing?.grooming,
        // Assessment - Motor
        gross_motor: editData.assessment?.motor?.gross_motor,
        fine_motor: editData.assessment?.motor?.fine_motor,
        // Assessment - Sensory
        sensory: editData.assessment?.sensory,
        // Assessment - Socialization
        language_communication:
          editData.assessment?.socialization?.language_communication,
        social_behaviour: editData.assessment?.socialization?.social_behaviour,
        mobility_in_neighborhood: editData.assessment?.socialization?.mobility,
        // Assessment - Cognitive
        attention: editData.assessment?.cognitive?.attention,
        identification_of_objects:
          editData.assessment?.cognitive?.identification_of_objects,
        use_of_objects: editData.assessment?.cognitive?.use_of_objects,
        following_instruction:
          editData.assessment?.cognitive?.following_instruction,
        awareness_of_danger:
          editData.assessment?.cognitive?.awareness_of_danger,
        concept_color: editData.assessment?.cognitive?.concept_formation?.color,
        concept_size: editData.assessment?.cognitive?.concept_formation?.size,
        concept_sex: editData.assessment?.cognitive?.concept_formation?.sex,
        concept_shape: editData.assessment?.cognitive?.concept_formation?.shape,
        concept_number:
          editData.assessment?.cognitive?.concept_formation?.number,
        concept_time: editData.assessment?.cognitive?.concept_formation?.time,
        concept_money: editData.assessment?.cognitive?.concept_formation?.money,
        // Assessment - Academic
        academic_reading: editData.assessment?.academic?.reading,
        academic_writing: editData.assessment?.academic?.writing,
        academic_arithmetic: editData.assessment?.academic?.arithmetic,
        // Assessment - Prevocational
        prevocational_ability:
          editData.assessment?.prevocational?.ability_and_interest,
        prevocational_interest:
          editData.assessment?.prevocational?.items_of_interest,
        prevocational_dislike:
          editData.assessment?.prevocational?.items_of_dislike,
        // Assessment - Other
        any_other: editData.assessment?.any_other,
        recommendation: editData.assessment?.recommendation,
        household: householdRows
          .map((row) => ({
            name: row.name,
            age: row.age,
            education: row.education,
            occupation: row.occupation,
            health: row.health,
            income: row.income,
          }))
          .filter((row) =>
            Object.values(row).some(
              (value) =>
                value !== null && value !== undefined && String(value).trim() !== "",
            ),
          ),
        // Remove empty placeholder drug rows before saving
        drug_history: (drugRows || [])
          .map((row) => ({
            name: row.name,
            dose: row.dose,
          }))
          .filter(
            (row) =>
              (row.name && String(row.name).trim()) ||
              (row.dose && String(row.dose).trim()),
          ),
        // Medical Information
        specific_diagnostic: editData.specific_diagnostic,
        medical_conditions: editData.medical_conditions,
        is_on_regular_drugs: editData.is_on_regular_drugs,
        drug_allergy: editData.drug_allergy,
        food_allergy: editData.food_allergy,
        allergies: editData.allergies,
      };
      // If photoFile is set, upload photo first, then update details
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        try {
          const res = await axios.post(
            `${baseUrl}/api/v1/students/${id}/photo`,
            formData,
          );
          const returned = res.data;
          console.debug("Photo upload (during save) response:", returned);
          const returnedPhoto =
            returned?.photo_url || returned?.photoUrl || null;
          if (returnedPhoto) {
            // set both conventions so other components can read either
            setStudent((prev) => ({
              ...(prev || {}),
              photoUrl: returnedPhoto,
              photo_url: returnedPhoto,
            }));
          } else {
            console.warn(
              "Photo upload returned no photo_url/photoUrl during save:",
              returned,
            );
          }
          // clear file input and revoke preview
          try {
            if (fileInputRef && fileInputRef.current)
              fileInputRef.current.value = null;
          } catch (err) {}
          if (photoPreview) {
            try {
              URL.revokeObjectURL(photoPreview);
            } catch (err) {}
          }
        } catch (err) {
          console.warn("Photo upload during save failed", err);
        } finally {
          setPhotoFile(null);
          setPhotoPreview(null);
        }
      }
      const putRes = await axios.put(
        `${baseUrl}/api/v1/students/${id}`,
        payload,
      );
      const putData = putRes?.data;
      // If backend returned updated student with photo, update UI immediately
      if (putData) {
        const pdPhoto = putData.photo_url || putData.photoUrl || null;
        if (pdPhoto) {
          setStudent((prev) => ({
            ...(prev || {}),
            photoUrl: pdPhoto,
            photo_url: pdPhoto,
          }));
        }
      }

      // Refresh the data cleanly (best-effort) and exit edit mode
      try {
        await fetchStudent();
      } catch (err) {
        console.warn("Could not refresh after save", err);
      }
      setEditMode(false);
    } catch (e) {
      console.error("Failed to save changes:", e);
      alert("Could not save changes. Please try again.");
    }
  };
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke previous preview to avoid leaking object URLs
      if (photoPreview) {
        try {
          URL.revokeObjectURL(photoPreview);
        } catch (err) {
          /* ignore */
        }
      }
      setPhotoFile(file);
      const tmpUrl = URL.createObjectURL(file);
      setPhotoPreview(tmpUrl); // Creates a temporary preview URL
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      alert("Please select a photo first.");
      return;
    }

    setPhotoUploading(true);
    const formData = new FormData();
    formData.append("file", photoFile);

    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      // Configure headers with authentication
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };

      // Upload photo to backend
      const res = await axios.post(
        `${baseUrl}/api/v1/students/${id}/photo`,
        formData,
        config,
      );
      const returned = res.data;
      console.log("Photo upload response:", returned);

      // Extract photo URL from response
      const returnedPhotoUrl =
        returned?.photo_url || returned?.photoUrl || null;

      if (returnedPhotoUrl) {
        // Update student state with new photo URL
        setStudent((prev) => ({
          ...(prev || {}),
          photoUrl: returnedPhotoUrl,
          photo_url: returnedPhotoUrl,
        }));

        showToast("Photo uploaded and saved successfully!", "success");
      } else {
        console.warn(
          "Photo uploaded but server did not return photo_url/photoUrl:",
          returned,
        );
        alert("Photo uploaded but URL not returned. Please refresh the page.");
      }

      // Clear the file input element
      if (fileInputRef?.current) {
        fileInputRef.current.value = null;
      }

      // Clean up preview and file state
      if (photoPreview) {
        try {
          URL.revokeObjectURL(photoPreview);
        } catch (err) {
          console.warn("Error revoking preview URL:", err);
        }
      }
      setPhotoFile(null);
      setPhotoPreview(null);

      // Refresh student data to ensure everything is in sync
      await fetchStudent();
    } catch (error) {
      console.error("Error uploading photo:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to upload photo.";
      showToast(`Failed to upload photo: ${errorMessage}`, "error");
    } finally {
      setPhotoUploading(false);
    }
  };

  // Document upload handlers
  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
      const fileType = (file.type || "").toLowerCase();
      const fileName = (file.name || "").toLowerCase();
      if (!allowedTypes.includes(fileType) && !fileName.match(/\.(pdf|png|jpg|jpeg)$/)) {
        showToast("Only PDF, PNG, JPG, or JPEG files are allowed", "error");
        if (documentInputRef.current) documentInputRef.current.value = null;
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast(
          `File size exceeds 5MB limit. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          "error",
        );
        if (documentInputRef.current) documentInputRef.current.value = null;
        return;
      }

      setDocumentFile(file);
    }
  };

  const handleDocumentUpload = async () => {
    if (!documentFile) {
      alert("Please select a PDF document first.");
      return;
    }

    setDocumentUploading(true);
    const formData = new FormData();
    formData.append("file", documentFile);

    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };

      const res = await axios.post(
        `${baseUrl}/api/v1/students/${id}/documents`,
        formData,
        config,
      );
      console.log("Document upload response:", res.data);

      showToast(
        `Document "${documentFile.name}" uploaded successfully!`,
        "success",
      );

      // Clear file input
      if (documentInputRef?.current) {
        documentInputRef.current.value = null;
      }
      setDocumentFile(null);

      // Refresh documents list
      await fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to upload document.";
      showToast(`Failed to upload document: ${errorMessage}`, "error");
    } finally {
      setDocumentUploading(false);
    }
  };

    const fetchDocuments = async () => {
    setDocumentsLoading(true);
    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
  
      const res = await axios.get(
        `${baseUrl}/api/v1/students/${id}/documents`,
        config,
      );
  
      const fetchedDocuments = res.data.documents || [];
      setDocuments(fetchedDocuments);
      syncUploadedDocTypesFromDocuments(fetchedDocuments);
      return fetchedDocuments;
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
      return [];
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDownloadDocument = async (documentId, documentName) => {
    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const res = await axios.get(
        `${baseUrl}/api/v1/students/${id}/documents/${documentId}`,
        config,
      );
      const document = res.data;
      const mimeType = getDocumentMimeType(document);

      // Convert base64 to blob and download
      const base64Data = document.file_data.split(",")[1] || document.file_data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      showToast(
        `Document "${documentName}" downloaded successfully!`,
        "success",
      );
    } catch (error) {
      console.error("Error downloading document:", error);
      showToast("Failed to download document.", "error");
    }
  };

  const handleViewDocument = async (documentId, documentName) => {
    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const res = await axios.get(
        `${baseUrl}/api/v1/students/${id}/documents/${documentId}`,
        config,
      );
      const document = res.data;
      const mimeType = getDocumentMimeType(document);

      // Convert base64 to blob and open in a preview modal
      const base64Data = document.file_data.split(",")[1] || document.file_data;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const url = URL.createObjectURL(blob);
      if (previewDocument?.url) {
        URL.revokeObjectURL(previewDocument.url);
      }
      setPreviewDocument({
        id: documentId,
        name: document.name || documentName,
        mimeType,
        url,
      });
    } catch (error) {
      console.error("Error viewing document:", error);
      showToast("Failed to view document.", "error");
    }
  };

  const closeDocumentPreview = () => {
    if (previewDocument?.url) {
      URL.revokeObjectURL(previewDocument.url);
    }
    setPreviewDocument(null);
  };

  useEffect(() => {
    return () => {
      if (previewDocument?.url) {
        URL.revokeObjectURL(previewDocument.url);
      }
    };
  }, [previewDocument]);

    const confirmDeleteDocument = (documentId, documentName, documentTypeId) => {
    setPendingDocumentDelete({ documentId, documentName, documentTypeId });
    setShowDocumentDeleteConfirm(true);
  };
  
    const handleDeleteDocument = async () => {
    if (!pendingDocumentDelete) return;
  
    const { documentId, documentName, documentTypeId } = pendingDocumentDelete;
  
    try {
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
  
      await axios.delete(
        `${baseUrl}/api/v1/students/${id}/documents/${documentId}`,
        config,
      );
  
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      setUploadedDocumentsByType((prev) => {
        const next = { ...prev };
        next[documentTypeId] = (next[documentTypeId] || []).filter(
          (doc) => doc.id !== documentId,
        );
        if (next[documentTypeId]?.length === 0) delete next[documentTypeId];
        return next;
      });
  
      if (SPECIAL_DOC_TYPES.includes(documentTypeId)) {
        clearDocumentUploadTimer(documentTypeId);
        setUploadedDocTypes((prev) => ({ ...prev, [documentTypeId]: false }));
      }
  
      showToast(`Document "${documentName}" deleted successfully!`, "success");
      await fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      showToast("Failed to delete document.", "error");
    } finally {
      setShowDocumentDeleteConfirm(false);
      setPendingDocumentDelete(null);
    }
  };

    const handleDocumentTypeUpload = async (file, docTypeId, docTypeLabel) => {
    try {
      setDocumentUploading(true);
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", docTypeId);
      formData.append("documentType", docTypeId);
      formData.append("documentTypeLabel", docTypeLabel);
  
      const response = await axios.post(
        `${baseUrl}/api/v1/students/${id}/documents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
            if (response.status !== 200) throw new Error("Upload failed");
      
      showToast(`${docTypeLabel} uploaded successfully`, "success");
      
      const fetchedDocuments = await fetchDocuments();
      const realUploadedDoc =
        (fetchedDocuments || [])
          .slice()
          .reverse()
          .find(
            (doc) =>
              doc.name === file.name &&
              Number(doc.file_size) === Number(file.size),
          ) || null;
      
      if (!realUploadedDoc) {
        throw new Error("Uploaded document was not found after refresh");
      }
      
      setUploadedDocumentsByType((prev) => ({
        ...prev,
        [docTypeId]: [
          ...(prev[docTypeId] || []).filter((doc) => doc.id !== realUploadedDoc.id),
          {
            ...realUploadedDoc,
            documentType: docTypeId,
          },
        ],
      }));
      
      setUploadedDocTypes((prev) => ({ ...prev, [docTypeId]: true }));
      
      if (!SPECIAL_DOC_TYPES.includes(docTypeId)) {
        clearDocumentUploadTimer(docTypeId);
        documentUploadTimersRef.current[docTypeId] = window.setTimeout(() => {
          setUploadedDocTypes((prev) => ({ ...prev, [docTypeId]: false }));
          delete documentUploadTimersRef.current[docTypeId];
        }, DOCUMENT_UPLOAD_RESET_MS);
      }
      
      
  
      
      
  
      
  
    } catch (error) {
      console.error("Error uploading document:", error);
      showToast(`Failed to upload ${docTypeLabel}`, "error");
    } finally {
      setDocumentUploading(false);
    }
  };

  // In StudentPage.js -> fetchStudent()

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const { data } = await axios.get(`${baseUrl}/api/v1/students/${id}`);
      console.debug("fetchStudent: raw API response for student", data);

      // --- REPLACE your old mapping object with this new one ---
      const mappedForDisplay = {
        // == Core & Academic ==
        name: data.name,
        age: data.age,
        studentId: data.student_id,
        dob: data.dob,
        gender: data.gender,
        class: data.class_name,
        rollNo: data.roll_no,
        division: data.division,
        academicYear: data.academic_year,
        admissionNumber: data.admission_number,
        admissionDate: data.admission_date,
        // class_teacher removed from API

        // == Personal & Contact ==
        religion: data.religion,
        caste: data.caste,
        category: data.category,
        ud_id: data.ud_id,
        bloodGroup: data.blood_group,
        aadharNumber: formatAadhaar(data.aadhar_number),
        phoneNumber: data.phone_number,
        email: data.email,

        // == Address ==
        birthPlace: data.birth_place,
        houseName: data.house_name,
        streetName: data.street_name,
        postOffice: data.post_office,
        pinCode: data.pin_code,
        revenueDistrict: data.revenue_district,
        blockPanchayat: data.block_panchayat,
        localBody: data.local_body,
        taluk: data.taluk,
        address: [data.house_name, data.street_name, data.post_office]
          .filter(Boolean)
          .join(", "),
        address_and_phone: data.address_and_phone,

        // == Family Info ==
        fatherName: data.father_name,
        fatherEducation: data.father_education,
        fatherOccupation: data.father_occupation,
        motherName: data.mother_name,
        motherEducation: data.mother_education,
        motherOccupation: data.mother_occupation,
        guardianName: data.guardian_name,
        guardianOccupation: data.guardian_occupation,
        guardianRelationship: data.guardian_relationship,
        guardianContact: data.guardian_contact,
        totalFamilyIncome: data.total_family_income,

        // == Bank Details ==
        bankName: data.bank_name,
        accountNumber: data.account_number,
        branch: data.branch,
        ifscCode: data.ifsc_code
          ? String(data.ifsc_code).toUpperCase()
          : data.ifsc_code,

        // == Medical & ID ==
        disabilityType: data.disability_type,
        disabilityPercentage: data.disability_percentage,
        identificationMarks: data.identification_marks,
        photoUrl: data.photo_url,
        specific_diagnostic: data.specific_diagnostic,
        medical_conditions: data.medical_conditions,
        is_on_regular_drugs: data.is_on_regular_drugs,
        allergies: data.allergies,
        drug_allergy: data.drug_allergy,
        food_allergy: data.food_allergy,
        // Raw drug history array from the API (array of {name, dose})
        drug_history: data.drug_history || [],
        // Household composition array from the API
        household: data.household || [],

        // == Case Record Fields ==
        informantName: data.informant_name,
        informantRelationship: data.informant_relationship,
        durationOfContact: data.duration_of_contact,
        presentComplaints: data.present_complaints,
        previousTreatments: data.previous_treatments,

        // Re-structured for simplicity
        familyHistory: {
          mental_illness: data.family_history_mental_illness,
          mental_retardation: data.family_history_mental_retardation,
          epilepsy: data.family_history_epilepsy,
        },
        birthHistory: {
          prenatal: data.prenatal_history,
          natal: data.natal_history,
          postnatal: data.postnatal_history,
        },
        developmentHistory: {
          smiles_at_other: data.smiles_at_other,
          head_control: data.head_control,
          sitting: data.sitting,
          responds_to_name: data.responds_to_name,
          babbling: data.babbling,
          first_words: data.first_words,
          standing: data.standing,
          walking: data.walking,
          two_word_phrases: data.two_word_phrases,
          toilet_control: data.toilet_control,
          sentences: data.sentences,
          physical_deformity: data.physical_deformity,
        },
        additionalInfo: {
          // You can map these individually if you prefer
          school_history: data.school_history,
          occupational_history: data.occupational_history,
          behaviour_problems: data.behaviour_problems,
        },
        // Build a nested assessment object from flat DB fields so the UI can read it
        assessment: {
          self_help: {
            food_habits: {
              eating: data.eating_habits,
              drinking: data.drinking_habits,
            },
            toilet_habits: data.toilet_habits,
            brushing: data.brushing,
            bathing: data.bathing,
            dressing: {
              removing_and_wearing: data.dressing_removing_wearing,
              buttoning: data.dressing_buttoning,
              footwear: data.dressing_footwear,
              grooming: data.dressing_grooming,
            },
          },
          motor: {
            gross_motor: data.gross_motor,
            fine_motor: data.fine_motor,
          },
          sensory: data.sensory,
          socialization: {
            language_communication: data.language_communication,
            social_behaviour: data.social_behaviour,
            mobility: data.mobility_in_neighborhood,
          },
          cognitive: {
            attention: data.attention,
            identification_of_objects: data.identification_of_objects,
            use_of_objects: data.use_of_objects,
            following_instruction: data.following_instruction,
            awareness_of_danger: data.awareness_of_danger,
            concept_formation: {
              color: data.concept_color,
              size: data.concept_size,
              sex: data.concept_sex,
              shape: data.concept_shape,
              number: data.concept_number,
              time: data.concept_time,
              money: data.concept_money,
            },
          },
          academic: {
            reading: data.academic_reading,
            writing: data.academic_writing,
            arithmetic: data.academic_arithmetic,
          },
          prevocational: {
            ability_and_interest: data.prevocational_ability,
            items_of_interest: data.prevocational_interest,
            items_of_dislike: data.prevocational_dislike,
          },
          behaviour_problems: data.behaviour_problems,
          any_other: data.any_other,
          recommendation: data.recommendation,
        },
      };

      // After mapping student, fetch therapy reports for this student
      try {
        // backend endpoint expects numeric DB id, use data.id if available, otherwise fallback to route id
        fetchReports(data.id || id);
      } catch (err) {
        console.warn("Could not fetch reports after student load", err);
      }

      setStudent(mappedForDisplay);
      const { studentId, photoUrl, address, ...editableFields } =
        mappedForDisplay;
      setEditData(editableFields);
      setDrugRows(normalizeDrugRows(mappedForDisplay.drug_history));
    } catch (e) {
      setStudent(null);
      console.error("Failed to fetch student data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch therapy reports for a student id
  const fetchReports = async (studentId) => {
    try {
      setReportsLoading(true);
      const baseUrl =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      const { data } = await axios.get(
        `${baseUrl}/api/v1/therapy-reports/student/${studentId}`,
        config,
      );
      // data is expected to be an array of reports
      const list = Array.isArray(data) ? data : [];
      // sort by report_date desc
      list.sort((a, b) =>
        (b.report_date || b.created_at || "").localeCompare(
          a.report_date || a.created_at || "",
        ),
      );
      setReports(list);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const renderReportTextField = (label, value) => {
    const text = typeof value === "string" ? value.trim() : value;
    if (!text) return null;

    return (
      <div>
        <div className="text-xs text-[#6F6C90]">{label}</div>
        <div className="text-sm whitespace-pre-wrap">{value}</div>
      </div>
    );
  };

  useEffect(() => {
  const fetchTeacherUsernames = async () => {
    try {

      const baseUrl =
        process.env.REACT_APP_API_BASE_URL ||
        "http://localhost:8000";

      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${baseUrl}/api/v1/teachers/`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      // Convert emails to usernames
      const usernames = (res.data || [])
        .map((t) =>
          (t.email || "")
            .split("@")[0]
            .trim()
            .toLowerCase()
        )
        .filter((u) => u);

      // Remove duplicates + sort
      const unique = Array.from(new Set(usernames)).sort();

      setTeacherUsers(unique);

    } catch (err) {

      console.error(err);

      setTeacherUsers([]);
    }
  };

  if (activeTab === "student-details") {
    fetchTeacherUsernames();
  }

}, [activeTab]);

  useEffect(() => {
    if (id) {
      fetchStudent();
      fetchDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    try {
      if (typeof window === "undefined") return;
      const key = `special-education-tables:${id}`;
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((t) => ({
          ...t,
          isEditable: t.isEditable === true,
          assessment_phase: t.assessment_phase || getHighestFilledPhase(t),
          last_edited_at: t.last_edited_at || null,
          table_year: t.table_year || (t.report_date ? new Date(t.report_date).getFullYear() : null),
          quarterEditDates: t.quarterEditDates || {},
          savedPhases: t.savedPhases || {},
        }));
        setSavedTables(normalized);
      }
    } catch (err) {
      console.warn("Failed to load saved Special Education tables", err);
    }
  }, [id]);

  // Load IEP data when component mounts or student ID changes
  useEffect(() => {
    if (id) {
      loadIepData();
    }
  }, [id]);

  // manual table
  const handleAddManualTable = () => {
    if (unsavedTableIndex !== null) {
    showToast("Save the current table before creating a new one", "warning");
    return;
  }
    if (!reportDate) {
      alert("Please select a report date before creating the table.");
      return;
    }
  
    const nowIso = new Date().toISOString();
    const tableYear = new Date(reportDate).getFullYear();
  
    const baseMetaHeaders = [
      "Student Name",
      "Register Number",
      "Assessment Date",
      "Skill Area",
    ];
    const sessionHeaders = Array.from({ length: 20 }, (_, i) => String(i + 1));
    const summaryHeaders = ["Total A", "Total B", "I Qr", "II Qr", "III Qr", "IV Qr"];
    const headers = [...baseMetaHeaders, ...sessionHeaders, ...summaryHeaders];
  
    const rows = SPECIAL_EDU_SKILLS.map((skill) => {
      const row = {};
      headers.forEach((h) => {
        const lower = String(h).toLowerCase();
        if (lower === "student name") row[h] = student?.name || "";
        else if (lower === "register number") row[h] = student?.admissionNumber || "";
        else if (lower === "assessment date") row[h] = reportDate || "";
        else if (lower.includes("skill")) row[h] = skill.label;
        else if (sessionHeaders.includes(h)) row[h] = "B";
        else row[h] = "";
      });
      return row;
    });
  
    const newTable = {
      headers,
      rows,
      assessment_phase: "1st assmt",
      report_date: reportDate || "",
      table_year: tableYear,
      extracted_at: nowIso,
      isEditable: true,
      last_edited_at: nowIso,
      quarterSnapshots: {},
      quarterOverrides: {},
    };
  
    setSavedTables((prev) => {
      const updated = [...prev, newTable];
  
      // persist
      try {
        if (typeof window !== "undefined" && id) {
          window.localStorage.setItem(
            `special-education-tables:${id}`,
            JSON.stringify(updated),
          );
        }
      } catch (err) {
        console.warn("Failed to persist manually added Special Education table", err);
      }
  
      // Determine where the new table appears when the UI sorts newest-first,
      // then mark that index as opened and keep questions closed.
      const sorted = [...updated].sort((a, b) => {
        const da = new Date(a.report_date || a.extracted_at || 0);
        const db = new Date(b.report_date || b.extracted_at || 0);
        return db - da;
      });
      const newIndex = sorted.findIndex((t) => t === newTable);
  
      setShowTableDetails((prevDetails) => ({
        ...prevDetails,
        [newIndex]: true,
      }));
      setQuestionsOpenByTable((prev) => ({ ...(prev || {}), [newIndex]: false }));
      setActiveSkillByTable((prev) => ({ ...(prev || {}), [newIndex]: null }));
      setUnsavedTableIndex(newIndex);
      return updated;
    });
  };


  
  // Helper function to format dates in a human-friendly way (no seconds)
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return (
      date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  };


  const parseMonthYearKey = (key) => {
    // key format: "January 2026"
    if (!key) return new Date(0);
    const [month, year] = String(key).split(" ");
    return new Date(`${month} 1, ${year}`);
  };

    const warnIfEditingIep = () => {
    if (iepFormVisible || editingIepMonth) {
      showToast("Save the IEP report before leaving or opening another report", "warning");
      return true;
    }
    return false;
  };

  const discardIepDraft = () => {
    const selectedMonth = iepData?.selectedMonth || "";
    setPendingNewIepMonth(null);
    setExpandedIepMonth(null);
    setEditingIepMonth(null);
    setIepData({
      ...createEmptyIepData(),
      selectedMonth,
    });
    showToast("Draft report removed.", "success");
  };

  const renderIepDraftCard = () => {
    if (!pendingNewIepMonth || editingIepMonth !== pendingNewIepMonth) return null;

    const monthYearKey = pendingNewIepMonth;
    const adlItems = Array.isArray(iepData.sections?.adlSkills) ? iepData.sections.adlSkills : [];
    const academicItems = Array.isArray(iepData.sections?.academic) ? iepData.sections.academic : [];
    const behaviouralItems = Array.isArray(iepData.sections?.behaviouralSkills) ? iepData.sections.behaviouralSkills : [];
    const rowCount = Math.max(adlItems.length, academicItems.length, behaviouralItems.length);

    return (
      <div className="mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
        <div className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-[#E38B52]/10 to-transparent rounded-t-xl -mx-6 -mt-6 mb-6">
          <div className="text-left flex-1 text-base font-semibold text-[#170F49]">
            DRAFT REPORT FOR {monthYearKey.toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={(e) => { e.stopPropagation(); saveIepData(); }} className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm hover:bg-green-700">
              Save
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); discardIepDraft(); }} className="px-3 py-1.5 rounded-md bg-red-100 text-red-700 text-sm hover:bg-red-200">
              Remove Draft
            </button>
          </div>
        </div>

        <div className="px-0 py-0 border-t border-[#E38B52]/20 space-y-6 bg-white/50">
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col style={{ width: "34%" }} />
                <col style={{ width: "33%" }} />
                <col style={{ width: "33%" }} />
              </colgroup>
              <thead className="bg-gradient-to-r from-[#E38B52] to-[#F5A572]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-white/30">
                    <div className="flex items-center justify-between gap-3">
                      <span>ADL SKILLS</span>
                      <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white text-[#E38B52] text-xs font-semibold shadow-sm hover:bg-[#FFF3E8] hover:text-[#C8742F] transition-colors whitespace-nowrap" onClick={() => addIepSectionItem("adlSkills")}>
                        <span className="text-base leading-none">+</span>
                        <span>Add Row</span>
                      </button>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-white/30">
                    <div className="flex items-center justify-between gap-3">
                      <span>ACADEMIC</span>
                      <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white text-[#E38B52] text-xs font-semibold shadow-sm hover:bg-[#FFF3E8] hover:text-[#C8742F] transition-colors whitespace-nowrap" onClick={() => addIepSectionItem("academic")}>
                        <span className="text-base leading-none">+</span>
                        <span>Add Row</span>
                      </button>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                    <div className="flex items-center justify-between gap-3">
                      <span>BEHAVIOURAL SKILLS</span>
                      <button type="button" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white text-[#E38B52] text-xs font-semibold shadow-sm hover:bg-[#FFF3E8] hover:text-[#C8742F] transition-colors whitespace-nowrap" onClick={() => addIepSectionItem("behaviouralSkills")}>
                        <span className="text-base leading-none">+</span>
                        <span>Add Row</span>
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {rowCount === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-500">No IEP skills added yet.</td>
                  </tr>
                ) : (
                  Array.from({ length: rowCount }).map((_, index) => (
                    <tr key={`iep-draft-row-${index}`}>
                      <td className="px-4 py-3 align-top text-sm text-gray-700 border-r border-gray-200">
                        {adlItems[index] ? (
                          <div className="flex items-start gap-2">
                            <textarea value={adlItems[index].text} onChange={(e) => handleIepSectionChange("adlSkills", adlItems[index].id, e.target.value)} placeholder="Enter ADL skill" className="input-edit h-20 resize-none flex-1" />
                            <button type="button" className="text-red-500 mt-2 shrink-0" onClick={() => removeIepSectionItem("adlSkills", adlItems[index].id)} aria-label="Remove ADL skill">
                              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /></svg>
                            </button>
                          </div>
                        ) : <div className="h-20" />}
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-gray-700 border-r border-gray-200">
                        {academicItems[index] ? (
                          <div className="flex items-start gap-2">
                            <textarea value={academicItems[index].text} onChange={(e) => handleIepSectionChange("academic", academicItems[index].id, e.target.value)} placeholder="Enter academic entry" className="input-edit h-20 resize-none flex-1" />
                            <button type="button" className="text-red-500 mt-2 shrink-0" onClick={() => removeIepSectionItem("academic", academicItems[index].id)} aria-label="Remove academic entry">
                              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /></svg>
                            </button>
                          </div>
                        ) : <div className="h-20" />}
                      </td>
                      <td className="px-4 py-3 align-top text-sm text-gray-700">
                        {behaviouralItems[index] ? (
                          <div className="flex items-start gap-2">
                            <textarea value={behaviouralItems[index].text} onChange={(e) => handleIepSectionChange("behaviouralSkills", behaviouralItems[index].id, e.target.value)} placeholder="Enter behavioural skill" className="input-edit h-20 resize-none flex-1" />
                            <button type="button" className="text-red-500 mt-2 shrink-0" onClick={() => removeIepSectionItem("behaviouralSkills", behaviouralItems[index].id)} aria-label="Remove behavioural skill">
                              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 14h10l1-14" /></svg>
                            </button>
                          </div>
                        ) : <div className="h-20" />}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#170F49] mb-2">IEP OF THE STUDENT:</label>
            <textarea value={iepData.iepStudent} onChange={(e) => handleIepInputChange("iepStudent", e.target.value)} placeholder="Enter the Individual Education Program details..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] resize-none" rows={4} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#170F49] mb-2">Remarks:</label>
            <textarea value={iepData.remarks} onChange={(e) => handleIepInputChange("remarks", e.target.value)} placeholder="Enter additional remarks..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] resize-none" rows={4} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#6F6C90] mb-2">Principal</label>
              <input type="text" value={iepData.signatures.principal} onChange={(e) => handleSignatureChange("principal", e.target.value)} placeholder="Principal's signature/name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6F6C90] mb-2">Teacher</label>
              <input type="text" value={iepData.signatures.teacher} onChange={(e) => handleSignatureChange("teacher", e.target.value)} placeholder="Teacher's signature/name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6F6C90] mb-2">Parent/Guardian</label>
              <input type="text" value={iepData.signatures.parent} onChange={(e) => handleSignatureChange("parent", e.target.value)} placeholder="Parent's signature/name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52]" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Check if a phase is unlocked based on previous phases being saved
  const isPhaseUnlocked = (table, targetPhase) => {
  if (targetPhase === "1st assmt") return true;

  // prefer persisted savedPhases stored on the table object
  const tableKey = savedTables.indexOf(table);
  const persistedStatus = table && table.savedPhases ? table.savedPhases : null;
  const phaseStatus = persistedStatus || (phaseSavedStatus[tableKey] || {});

  const phaseOrder = ["1st assmt", "1st Qtr", "2nd Qtr", "3rd Qtr", "4th Qtr"];
  const targetIdx = phaseOrder.indexOf(targetPhase);
  const prevPhase = phaseOrder[targetIdx - 1];

  return !!phaseStatus[prevPhase];
  };

  const handleSetTableEditable = (targetTable, editable) => {
    if (editable) {
      // Entering edit mode - mark as unsaved
      const tableIndex = savedTables.indexOf(targetTable);
      setUnsavedTableIndex(tableIndex);
    } else {
      // Exiting edit mode (saving) - clear unsaved flag
      setUnsavedTableIndex(null);
      
      setPhaseSavedStatus((prev) => ({
        ...prev,
        [savedTables.indexOf(targetTable)]: {
          ...(prev[savedTables.indexOf(targetTable)] || {}),
          [targetTable.assessment_phase || "1st assmt"]: true,
        },
      }));
    }
  
    setSavedTables((prev) => {
      const nowIso = !editable ? new Date().toISOString() : null;
      const updated = prev.map((t) => {
        if (t !== targetTable) return t;
      
        const savedPhases = !editable
          ? { ...(t.savedPhases || {}), [t.assessment_phase || "1st assmt"]: true }
          : (t.savedPhases || {});
      
        return {
          ...t,
          isEditable: editable,
          last_edited_at: !editable ? nowIso : t.last_edited_at || nowIso,
          savedPhases,
        };
      });
  
      try {
        if (typeof window !== "undefined" && id) {
          const key = `special-education-tables:${id}`;
          window.localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn("Failed to persist table edit state", err);
      }
  
      return updated;
    });
  };

  const handleDeleteTable = (viewIndex) => {
    setSavedTables((prev) => {
      // Reproduce the same sort used in the JSX
      const sorted = [...prev].sort((a, b) => {
        const da = new Date(a.report_date || a.extracted_at || 0);
        const db = new Date(b.report_date || b.extracted_at || 0);
        return db - da; // newest first
      });
      const tableToDelete = sorted[viewIndex];
      const updated = prev.filter((t) => t !== tableToDelete);

      try {
        if (typeof window !== "undefined" && id) {
          const key = `special-education-tables:${id}`;
          window.localStorage.setItem(key, JSON.stringify(updated));
        }
      } catch (err) {
        console.warn("Failed to persist deleted table list", err);
      }

      return updated;
    });    
  };

    const buildEditedExportRows = (table) => {
    const rows = (table?.rows || []).map((row) => ({ ...row }));
    const snapshots = table?.quarterSnapshots || {};
  
    Object.entries(snapshots).forEach(([phase, phaseData]) => {
      Object.entries(phaseData || {}).forEach(([cellKey, value]) => {
        const [rowIndexStr, colName] = String(cellKey).split(":");
        const rowIndex = Number(rowIndexStr);
        if (rows[rowIndex]) {
          rows[rowIndex][colName] = value;
        }
      });
    });
  
    return rows;
  };

    const loadPdfLogo = async (logoUrl) => {
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = logoUrl;
      });
    } catch (error) {
      console.warn("Failed to load logo for PDF:", error);
      return null;
    }
  };

    const getPhaseCounts = (row, rowIdx, targetPhase, sessionHeaders, snapshots) => {
      let a = 0;
      let b = 0;
    
      sessionHeaders.forEach((colName) => {
        // try numeric field first, then "Session N" variant
        const raw = row[colName] ?? row[`Session ${colName}`] ?? "";
        const baseVal = typeof raw === "string" ? raw.trim().toUpperCase() : "";
    
        // compute effective value from snapshots
        const cellKey = `${rowIdx}:${colName}`;
        const effective = getEffectiveValueForPhase(baseVal, cellKey, targetPhase, snapshots);
    
        if (effective === "A") a++;
        else if (effective === "B") b++;
      });
    
      return { aCount: a, bCount: b };
    };

    // returns { effective, previous } where `previous` is the last different value before `effective`
  function detectHistoricalChange(baseVal, cellKey, phase, snapshots = {}) {
    const phases = SPECIAL_EDU_PHASE_ORDER; // ['1st Qtr','2nd Qtr','3rd Qtr','4th Qtr']
    const idx = Math.max(0, phases.indexOf(phase));
    let effective = baseVal;
    let previous = null;
  
    for (let i = 0; i <= idx; i++) {
      const p = phases[i];
      const snap = snapshots[p];
      if (snap && snap.hasOwnProperty(cellKey)) {
        const v = snap[cellKey];
        if (v !== effective) {
          previous = effective;
          effective = v;
        }
      }
    }
  
    // If nothing in snapshots but effective differs from baseVal, mark previous as baseVal
    if (previous === null && effective !== baseVal) previous = baseVal;
  
    return { effective, previous };
  }

  const handleExportToPDF = async (table, index) => {
    if (!table || !table.rows || table.rows.length === 0) return;
    const rows = table.rows || [];
  
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const exportPhase = table.assessment_phase || getHighestFilledPhase(table);
      const snapshots = table.quarterSnapshots || {};
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
  
      const marginLeft = 6;
      const marginRight = 6;
      const marginTop = 6;
      const marginBottom = 6;
  
      const studentName = table.rows?.[0]?.["Student Name"] || student?.name || "Unknown";
     
      
  
      const rawHeaders =
        table.headers && table.headers.length
          ? table.headers
          : table.rows && table.rows.length
            ? Object.keys(table.rows[0] || {})
            : [];
      
      const allHeaders = rawHeaders.filter(
        (h) =>
          h !== "Student Name" &&
          h !== "Register Number" &&
          h !== "Assessment Date",
      );
      
      const normalize = (h) =>
        String(h || "")
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9]/g, "");
      
      const totalAKey = allHeaders.find((h) => normalize(h) === "totala");
      const totalBKey = allHeaders.find((h) => normalize(h) === "totalb");
      
      const quarterDefs = [
        { pattern: "iqr", label: "I Qr", phase: "1st Qtr" },
        { pattern: "iiqr", label: "II Qr", phase: "2nd Qtr" },
        { pattern: "iiiqr", label: "III Qr", phase: "3rd Qtr" },
        { pattern: "ivqr", label: "IV Qr", phase: "4th Qtr" },
      ];
      
      const quarterKeys = quarterDefs
        .map((def) => ({
          def,
          key: allHeaders.find((h) => normalize(h) === def.pattern) || null,
          phase: def.phase,
          label: def.label,
        }))
        .filter((item) => item.key);
      
      const summarySet = new Set(
        [totalAKey, totalBKey, ...quarterKeys.map((q) => q.key)].filter(Boolean),
      );
      
      const baseHeaders = allHeaders.filter((h) => !summarySet.has(h));
      const skillHeader =
        baseHeaders.find((h) => String(h).toLowerCase().includes("skill")) ||
        baseHeaders[0];
      
      const sessionHeaders = baseHeaders.filter((h) => h !== skillHeader);
  
      const phaseTotalsByRow = (table.rows || []).map((row, rowIdx) => ({
        "1st assmt": getPhaseCounts(row, rowIdx, "1st assmt", sessionHeaders, snapshots),
        "1st Qtr": getPhaseCounts(row, rowIdx, "1st Qtr", sessionHeaders, snapshots),
        "2nd Qtr": getPhaseCounts(row, rowIdx, "2nd Qtr", sessionHeaders, snapshots),
        "3rd Qtr": getPhaseCounts(row, rowIdx, "3rd Qtr", sessionHeaders, snapshots),
        "4th Qtr": getPhaseCounts(row, rowIdx, "4th Qtr", sessionHeaders, snapshots),
      }));
          
      const visibleColumns = [];
  
      visibleColumns.push({
        group: null,
        header: skillHeader,
        subLabel: null,
        fieldName: skillHeader,
        isSkill: true,
        getValue: (row) => row[skillHeader],
      });
  
      sessionHeaders.forEach((h) => {
        visibleColumns.push({
          group: null,
          header: String(h).replace(/^Session\s+/i, ""),
          subLabel: null,
          fieldName: h,
          isSkill: false,
          getValue: (row) => row[h],
        });
      });
  
      if (totalAKey) {
        visibleColumns.push({
          group: "1st Assmt",
          header: "A",
          subLabel: "A",
          fieldName: totalAKey,
          getValue: (row, rowIdx) =>
            phaseTotalsByRow[rowIdx]?.["1st assmt"]?.aCount ?? 0
        });
      }
  
      if (totalBKey) {
        visibleColumns.push({
          group: "1st Assmt",
          header: "B",
          subLabel: "B",
          fieldName: totalBKey,
          getValue: (row, rowIdx) =>
            phaseTotalsByRow[rowIdx]?.["1st assmt"]?.bCount ?? 0
        });
      }
  
      quarterKeys.forEach(({ key, phase, label }) => {
        visibleColumns.push({
          group: label,
          header: "A",
          subLabel: "A",
          fieldName: key,
          getValue: (row, rowIdx) =>
            phaseTotalsByRow[rowIdx]?.[phase]?.aCount ?? 0,
        });
        visibleColumns.push({
          group: label,
          header: "B",
          subLabel: "B",
          fieldName: key,
          getValue: (row, rowIdx) =>
            phaseTotalsByRow[rowIdx]?.[phase]?.bCount ?? 0,
        });
      });
  
      const colWidths = visibleColumns.map((col, idx) => {
        if (idx === 0) return 46;
        if (
          !col.group &&
          (/^session\s*/i.test(String(col.fieldName)) || /^\d+$/.test(String(col.fieldName)))
        )
          return 6.0;
        return 7.0;
      });
  
      const tableWidth = pageWidth - marginLeft - marginRight;
      const widthScale = tableWidth / colWidths.reduce((sum, w) => sum + w, 0);
      const scaledColWidths = colWidths.map((w) => w * widthScale);
  
      const logoDataUrl = schoolLogo;
  
      let y = marginTop;
  
      const drawSchoolHeader = () => {
        const logoW = 28;
        const logoH = 28;
        const logoX = marginLeft;
        const logoY = y;
      
        try {
          // use local import (schoolLogo) Ã¢â‚¬â€ avoids CORS
          doc.addImage(schoolLogo, "PNG", logoX, logoY, logoW, logoH);
        } catch (e) {
          console.warn("Logo draw failed:", e);
        }
      
        // center title, shifted down to align with logo
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(
          "ST. MARTHA'S SPECIAL SCHOOL FOR THE MENTALLY CHALLENGED",
          pageWidth / 2,
          y + 8,
          { align: "center" }
        );
      
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(
          "Reg.No: SJD/4315/2024/RPWD2, Kalpana Road, Chittattumukku P.O. Menamkulam, Trivandrum - 695 301",
          pageWidth / 2,
          y + 12,
          { align: "center" }
        );
        doc.text(
          "Phone: 0471/2705 764 - 9388084403 Email: stmarthaspecialschool@gmail.com",
          pageWidth / 2,
          y + 16,
          { align: "center" }
        );
      
        y += Math.max(logoH, 20) + 2;
        doc.setDrawColor(90);
        doc.line(marginLeft, y, pageWidth - marginRight, y);
        y += 6;
      };
  
      const quarterEditDates = table.quarterEditDates || {};
      const centerX = pageWidth / 2;

      
      
      const drawLegendCell = (x, yPos, mode) => {
        const w = 5.2;
        const h = 4.0;
        doc.rect(x, yPos, w, h, "S");
      
        const left = x + 0.6;
        const right = x + w - 0.6;
        const top = yPos + 0.6;
        const bottom = yPos + h - 0.6;
        const midX = x + w / 2;
        const midY = yPos + h / 2;
      
        if (mode === "horizontal") {
          doc.line(left, top, right, top);
          doc.line(left, midY, right, midY);
          doc.line(left, bottom, right, bottom);
        } else if (mode === "vertical") {
          doc.line(left, top, left, bottom);
          doc.line(midX, top, midX, bottom);
          doc.line(right, top, right, bottom);
        } else if (mode === "grid") {
          doc.line(left, top, right, top);
          doc.line(left, midY, right, midY);
          doc.line(left, bottom, right, bottom);
          doc.line(left, top, left, bottom);
          doc.line(midX, top, midX, bottom);
          doc.line(right, top, right, bottom);
        } else if (mode === "diagonal") {

          const offsetA = -0.35;
          const offsetC = 0.85;

          const yShiftt = 0.45;

          

          // same exact line length
          const x1 = left;
          const y1 = top + yShiftt;

          const x2 = right - 0.4;
          const y2 = bottom - 0.2;

          // left line
          doc.line(
            x1 + offsetA,
            y1,
            x2 + offsetA,
            y2
          );

          // right line
          doc.line(
            x1 + offsetC,
            y1,
            x2 + offsetC,
            y2
          );


        }
      };

      const formatDdMmYyyy = (value) => {
        if (!value) return "N/A";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "N/A";
        return date
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "-");
      };
      
      const drawMeta = () => {
        const legendX = pageWidth - marginRight - 68;
        const legendTextY = y;
        const legendLineGap = 4.3;
        const iconX = legendX + 34;
      
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.2);
      
        doc.text(`Student: ${studentName}`, marginLeft, y, { align: "left" });
      
        doc.text(
          [
            `1st Asst : ${formatDdMmYyyy(table.report_date)}`,
            `1st Qtr  : ${formatDdMmYyyy(quarterEditDates["1st Qtr"])}`,
            `2nd Qtr  : ${formatDdMmYyyy(quarterEditDates["2nd Qtr"])}`,
            `3rd Qtr  : ${formatDdMmYyyy(quarterEditDates["3rd Qtr"])}`,
            `4th Qtr  : ${formatDdMmYyyy(quarterEditDates["4th Qtr"])}`,
          ],
          centerX,
          y,
          { align: "center" }
        );
      
        doc.setFontSize(6.8);
        
        

        doc.text("Over the red [I Qr]", legendX, legendTextY, { align: "left" });
        drawLegendCell(iconX, legendTextY - 2.2, "horizontal");

        doc.text("Over the red [II Qr]", legendX, legendTextY + legendLineGap, { align: "left" });
        drawLegendCell(iconX, legendTextY + legendLineGap - 2.2, "vertical");

        doc.text("Over the red [III Qr]", legendX, legendTextY + legendLineGap * 2, { align: "left" });
        drawLegendCell(iconX, legendTextY + legendLineGap * 2 - 2.2, "grid");

        doc.text("Over the red [IV Qr]", legendX, legendTextY + legendLineGap * 3, { align: "left" });
        drawLegendCell(iconX, legendTextY + legendLineGap * 3 - 2.2, "diagonal");
      
        y += 22;
      };
  
      const drawCell = (x, yPos, width, height, text, style = {}) => {
        const {
          fillColor = [255, 255, 255],
          textColor = [0, 0, 0],
          bold = false,
          align = "center",
          fontSize = 5.8,
        } = style;
  
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
        doc.setDrawColor(120);
        doc.rect(x, yPos, width, height, "FD");
  
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(fontSize);
  
        const split = doc.splitTextToSize(String(text ?? ""), Math.max(1, width - 1.2));
        const lines = Array.isArray(split) ? split : [String(split)];
  
        const startY = yPos + (height - (lines.length - 1) * 2.4) / 2 + 0.8;
        lines.forEach((line, idx) => {
          doc.text(
            line,
            align === "left" ? x + 0.6 : x + width / 2,
            startY + idx * 2.4,
            align === "left" ? {} : { align: "center" },
          );
        });
      };
  
      const drawGroupedHeader = () => {
        const topRowHeight = 6.5;
        const secondRowHeight = 5.2;
  
        let x = marginLeft;
        let i = 0;
  
        while (i < visibleColumns.length) {
          const col = visibleColumns[i];
  
          if (!col.group) {
            const w = scaledColWidths[i];
            doc.setFillColor(245, 245, 245);
            doc.setDrawColor(120);
            doc.rect(x, y, w, topRowHeight + secondRowHeight, "FD");
  
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.4);
            doc.setTextColor(55, 55, 55);
            doc.text(String(col.header), x + w / 2, y + 5.2, { align: "center" });
  
            x += w;
            i += 1;
            continue;
          }

  
          let span = 0;
          while (
            i + span < visibleColumns.length &&
            visibleColumns[i + span].group === col.group
          ) {
            span += 1;
          }
  
          const groupWidth = visibleColumns
            .slice(i, i + span)
            .reduce((sum, _, idx) => sum + scaledColWidths[i + idx], 0);
  
          doc.setFillColor(245, 245, 245);
          doc.setDrawColor(120);
          doc.rect(x, y, groupWidth, topRowHeight, "FD");
  
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.4);
          doc.setTextColor(55, 55, 55);
          doc.text(String(col.group), x + groupWidth / 2, y + 3.6, { align: "center" });
  
          let innerX = x;
          for (let j = 0; j < span; j += 1) {
            const current = visibleColumns[i + j];
            const w = scaledColWidths[i + j];
  
            doc.setFillColor(245, 245, 245);
            doc.setDrawColor(120);
            doc.rect(innerX, y + topRowHeight, w, secondRowHeight, "FD");
  
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.0);
            doc.text(String(current.subLabel || current.header), innerX + w / 2, y + topRowHeight + 2.8, {
              align: "center",
            });
  
            innerX += w;
          }
  
          x += groupWidth;
          i += span;
        }
  
        y += topRowHeight + secondRowHeight;
      };
  
      drawSchoolHeader();
      drawMeta();
      drawGroupedHeader();
  
      const skillFontSize = 7.6;
      const rowFontSize = 7.2;
      const rowHeight = 6.4;
      const phase = exportPhase;

      const getPdfCellValue = (row, rowIdx, col) => {
        if (col.isSkill) {
          return String(row[col.fieldName] ?? "");
        }

        const snapshots = table.quarterSnapshots || {};
        const field = col.fieldName;
        const isSessionCol = !col.group && sessionHeaders.includes(field);

        if (isSessionCol) {
          const raw = row[field];
          const baseVal = typeof raw === "string" ? raw.trim().toUpperCase() : "";
          const cellKey = `${rowIdx}:${field}`;
          return getEffectiveValueForPhase(baseVal, cellKey, exportPhase, snapshots) || "";
        }

        return String(col.getValue(row, rowIdx) ?? "");
      };
  
      rows.forEach((row, rowIdx) => {
        let x = marginLeft;
        
        visibleColumns.forEach((col, colIdx) => {
          // compute the visible value (apply snapshots for quarter edits)
          const value = getPdfCellValue(row, rowIdx, col);
        
          const isSession = !col.group && sessionHeaders.includes(col.fieldName);
          const isGroupCell = !!col.group;
        
          if (col.isSkill) {
            drawCell(x, y, scaledColWidths[colIdx], rowHeight, value, {
              fillColor: [246, 246, 246],
              textColor: [30, 30, 30],
              bold: true,
              align: "left",
              fontSize: rowFontSize,
            });
          } else if (isSession) {
            const field = col.fieldName; // numeric string like "1","2",...
            const raw = table.rows?.[rowIdx]?.[field] ?? table.rows?.[rowIdx]?.[`Session ${field}`] ?? "";
            const baseVal = typeof raw === "string" ? raw.trim().toUpperCase() : "";
          
            const keyVariants = [
              `${rowIdx}:${field}`,
              `${rowIdx}:Session ${field}`,
              `${rowIdx}:${String(field).trim()}`,
            ];
          
            // walk phases to detect which quarter made the change
            const phases = SPECIAL_EDU_PHASE_ORDER;
            const idx = Math.max(0, phases.indexOf(exportPhase));
            let effective = baseVal;
            let changePhase = null; // which quarter caused the change
          
            for (let i = 0; i <= idx; i++) {
              const p = phases[i];
              const snap = snapshots[p] || {};
              for (const kv of keyVariants) {
                if (Object.prototype.hasOwnProperty.call(snap, kv)) {
                  const v = (snap[kv] ?? "").toString().trim().toUpperCase();
                  if (v && v !== effective) {
                    changePhase = p; // track which phase made the change
                    effective = v;
                  } else if (v && !effective) {
                    effective = v;
                    changePhase = p;
                  }
                  break;
                }
              }
            }

           
          
            // For 1st assmt: display A (no lines)
            // For quarters: display B but with pattern based on changePhase
            const displayVal =
              exportPhase === "1st assmt" && effective === "A"
                ? "A"
                : baseVal; // display base value (B) for quarters
          
            const cellVal = String(displayVal || "").trim().toUpperCase();
          
            drawCell(x, y, scaledColWidths[colIdx], rowHeight, cellVal, {
              fillColor:
                cellVal === "A"
                  ? [229, 243, 255]
                  : cellVal === "B"
                  ? [255, 232, 232]
                  : [255, 255, 255],
              textColor:
                cellVal === "A"
                  ? [31, 78, 121]
                  : cellVal === "B"
                  ? [168, 28, 28]
                  : [0, 0, 0],
              bold: true,
              align: "center",
              fontSize: rowFontSize,
            });
          
            // draw line pattern based on which quarter made the change (only if B was edited to A)
            if (baseVal === "B" && effective === "A" && changePhase) {
              const pad = 0.8;
              const inset = 1.5;
              const startX = x + inset;
              const endX = x + scaledColWidths[colIdx] - inset;
              const startY = y + pad;
              const endY = y + rowHeight - pad;
              const gap = 1.5;
          
              doc.setDrawColor(31, 78, 121);
              doc.setLineWidth(0.35);
          
              if (changePhase === "1st Qtr") {
                // three horizontal lines, slightly lower and extended
                const hOffset = 0.6;      // push lines lower
                const hExtend = 0.4;      // extend left/right a bit
                doc.line(startX - hExtend, startY + hOffset, endX + hExtend, startY + hOffset);
                doc.line(startX - hExtend, startY + gap + hOffset, endX + hExtend, startY + gap + hOffset);
                doc.line(startX - hExtend, startY + gap * 2 + hOffset, endX + hExtend, startY + gap * 2 + hOffset);
              } else if (changePhase === "2nd Qtr") {
                // three vertical lines (unchanged)
                const mid = startX + (endX - startX) / 2;
                doc.line(startX + 1, startY, startX + 1, endY);
                doc.line(mid, startY, mid, endY);
                doc.line(endX - 1, startY, endX - 1, endY);

              } else if (changePhase === "3rd Qtr") {
                // grid = horizontal + vertical
                const hOffset = 0.6;
                const hExtend = 0.4;
              
                // horizontal lines
                doc.line(startX - hExtend, startY + hOffset, endX + hExtend, startY + hOffset);
                doc.line(startX - hExtend, startY + gap + hOffset, endX + hExtend, startY + gap + hOffset);
                doc.line(startX - hExtend, startY + gap * 2 + hOffset, endX + hExtend, startY + gap * 2 + hOffset);
              
                // vertical lines
                const mid = startX + (endX - startX) / 2;
                doc.line(startX + 1, startY, startX + 1, endY);
                doc.line(mid, startY, mid, endY);
                doc.line(endX - 1, startY, endX - 1, endY);
              } else if (changePhase === "4th Qtr") {

                const offset1 = -0.55;
                const offset3 = 0.85;

                const lineLength = 0.78;
                const yShift = 0.45; // moves all lines downward

                doc.setLineWidth(0.45);

                // left
                doc.line(
                  startX + offset1,
                  startY + yShift,
                  startX + offset1 + (endX - startX) * lineLength,
                  startY + yShift + (endY - startY) * lineLength
                );

              

                // right
                doc.line(
                  startX + offset3,
                  startY + yShift,
                  startX + offset3 + (endX - startX) * lineLength,
                  startY + yShift + (endY - startY) * lineLength
                );

                doc.setLineWidth(0.35);
              }
            }
          } else if (isGroupCell) {
            const cellVal = String(value).trim();
            drawCell(x, y, scaledColWidths[colIdx], rowHeight, cellVal, {
              fillColor:
                cellVal === "A"
                  ? [229, 243, 255]
                  : cellVal === "B"
                  ? [255, 232, 232]
                  : [255, 255, 255],
              textColor:
                cellVal === "A"
                  ? [31, 78, 121]
                  : cellVal === "B"
                  ? [168, 28, 28]
                  : [0, 0, 0],
              bold: true,
              align: "center",
              fontSize: rowFontSize,
            });
          }
        
          x += scaledColWidths[colIdx];
        });
  
        y += rowHeight;
      });
  
      const safeName = String(studentName).replace(/[^a-zA-Z0-9_-]+/g, "_");
      doc.save(`special_education_table_${index + 1}_${safeName}.pdf`);
  
      showToast("Table exported to PDF successfully!", "success");
    } catch (error) {
      console.error("Error exporting table to PDF:", error);
      showToast("Failed to export table to PDF", "error");
    }
  };

  // Download Profile as PDF (screenshot)
  // REPLACE your existing function with this one
  // REPLACE your existing function with this one
  const handleDownloadProfile = async () => {
    if (!student) return;

    const doc = new jsPDF();
    let y = 15;
    const leftCol = 20;
    const boxX = 87;
    const boxWidth = 105;
    const boxHeight = 8;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    const checkPageBreak = () => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
    }; // --- PDF Header ---

    // Add school logo to top-left
    const logoWidth = 30;
    const logoHeight = 30;
    const logoX = leftCol;
    const logoY = 10;
    try {
      doc.addImage(schoolLogo, "PNG", logoX, logoY, logoWidth, logoHeight);
    } catch (e) {
      console.error("Error adding logo to PDF:", e);
    }

    // Student photo on top-right
    const imgWidth = 40;
    const imgHeight = 50;
    const imgX = pageWidth - imgWidth - leftCol;
    const imgY = 30;
    doc.setDrawColor(0);
    doc.rect(imgX, imgY, imgWidth, imgHeight);
    if (student.photoUrl) {
      try {
        doc.addImage(student.photoUrl, "JPEG", imgX, imgY, imgWidth, imgHeight);
      } catch (e) {
        console.error("Error adding image to PDF:", e);
      }
    }
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ST. MARTHA'S SPECIAL SCHOOL", pageWidth / 2, y + 5, {
      align: "center",
    });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("FOR THE MENTALLY CHALLENGED", pageWidth / 2, y + 12, {
      align: "center",
    });
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("STUDENT RECORD FORM", pageWidth / 2, y + 25, { align: "center" });
    y = Math.max(y + 25, imgY + imgHeight) + 5; // --- End Header ---
    const drawField = (label, value) => {
      // Multiline-aware field renderer. Calculates needed box height based on
      // wrapped text and prevents page overflow.
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      const text = String(value || "");
      const maxTextWidth = boxWidth - 4; // padding inside box
      const lines = text ? doc.splitTextToSize(text, maxTextWidth) : [""];
      const lineHeight = 6;
      const neededHeight = Math.max(boxHeight, lines.length * lineHeight + 4);

      // If the field won't fit on the current page, start a new page
      if (y + neededHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      // Label on the left
      doc.text(String(label || ""), leftCol, y + 6);
      // Draw box sized for content
      const boxY = y;
      doc.rect(boxX, boxY, boxWidth, neededHeight);

      // Write wrapped text inside the box
      let textY = boxY + 6; // first line baseline
      lines.forEach((ln) => {
        doc.text(ln, boxX + 2, textY);
        textY += lineHeight;
      });

      y += neededHeight + 6;
    };

    const drawSectionHeader = (title) => {
      checkPageBreak();
      y += 5;
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(title, leftCol, y);
      y += 8;
    };

    drawSectionHeader("Personal Information");
    drawField("NAME OF THE STUDENT", student.name);
    drawField("AGE", student.age);
    drawField("DATE OF BIRTH", student.dob);
    drawField("GENDER", student.gender);
    drawField("RELIGION", student.religion);
    drawField("CASTE", student.caste);
    drawField("AADHAR NUMBER", student.aadharNumber); // <-- ADDED

    drawSectionHeader("Address Information");
    drawField("BIRTH PLACE", student.birthPlace);
    drawField("HOUSE NAME", student.houseName);
    drawField("STREET NAME", student.streetName);
    drawField("POST OFFICE", student.postOffice);
    drawField("PIN CODE", student.pinCode);
    drawField("REVENUE DISTRICT", student.revenueDistrict);
    drawField("BLOCK PANCHAYAT", student.blockPanchayat);
    drawField("LOCAL BODY", student.localBody);
    drawField("TALUK", student.taluk);

    drawSectionHeader("Contact Information");
    drawField("PHONE NUMBER", student.phoneNumber);
    drawField("EMAIL", student.email);
    drawField("ADDRESS", student.address);

    drawSectionHeader("Family Information");
    drawField("FATHER NAME", student.fatherName); // We will only include the names as per your previous change
    drawField("MOTHER NAME", student.motherName); // --- vvv NEWLY ADDED SECTIONS vvv ---

    drawSectionHeader("Disability Details");
    drawField("TYPE OF DISABILITY", student.disabilityType);
    drawField(
      "PERCENTAGE",
      student.disabilityPercentage ? `${student.disabilityPercentage}%` : "",
    );

    drawSectionHeader("Identification Marks");
    drawField("MARKS", student.identificationMarks); // --- ^^^ END OF NEW SECTIONS ^^^ ---
    drawSectionHeader("Academic Information");
    drawField("DIVISION", student.division);
    drawField("CLASS", student.class);
    drawField("ROLL NUMBER", student.rollNo);
    drawField("ACADEMIC YEAR", student.academicYear);
    drawField("ADMISSION NUMBER", student.admissionNumber);
    drawField("DATE OF ADMISSION", student.admissionDate);

    drawSectionHeader("Bank Details");
    drawField("BANK NAME", student.bankName);
    drawField("ACCOUNT NUMBER", student.accountNumber);
    drawField("BRANCH", student.branch);
    drawField("IFSC CODE", student.ifscCode);

    doc.save(`Student_Profile_${student.name || "profile"}.pdf`);
  };

  // Download CASE RECORD only (same template style but restricted fields)
  const handleDownloadCaseRecord = async () => {
    if (!student) return;

    const doc = new jsPDF();
    let y = 20; // Initial y position

    // --- Document Constants ---
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 15;
    const rightMargin = 15;
    const contentWidth =
      doc.internal.pageSize.getWidth() - leftMargin - rightMargin;
    const labelColumnWidth = 60; // Width for the label/title part
    const valueColumnX = leftMargin + labelColumnWidth + 5;
    const valueColumnWidth = contentWidth - labelColumnWidth - 5;
    const defaultBoxHeight = 8;
    const lineHeight = 6;
    const fieldGap = 5; // Vertical gap between fields
    const sectionGap = 8; // Vertical gap after a section header

    // --- Helper Functions ---

    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
    };

    const drawSectionHeader = (title) => {
      checkPageBreak(20); // Check if header fits
      y += sectionGap;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, leftMargin, y);
      y += sectionGap;
      doc.setFont("helvetica", "normal");
    };

    const drawSubHeader = (title) => {
      checkPageBreak(15);
      y += 4;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(title, leftMargin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
    };

    const drawField = (label, value) => {
      const text = String(value || "N/A");
      const lines = doc.splitTextToSize(text, valueColumnWidth - 4);
      const neededHeight = Math.max(
        defaultBoxHeight,
        lines.length * lineHeight + 4,
      );

      checkPageBreak(neededHeight + fieldGap);

      // Draw Label
      doc.setFontSize(11);
      doc.text(label, leftMargin, y + 6);

      // Draw Value Box
      doc.rect(valueColumnX, y, valueColumnWidth, neededHeight);

      // Draw Value Text (multiline)
      let textY = y + 6;
      lines.forEach((line) => {
        doc.text(line, valueColumnX + 2, textY);
        textY += lineHeight;
      });

      y += neededHeight + fieldGap;
    };

    // --- PDF Generation Starts Here ---

    // Add school logo to top-left (moved slightly higher)
    const logoWidth = 30;
    const logoHeight = 30;
    const logoX = leftMargin;
    const logoY = 5; // moved up for Case Record PDF
    try {
      doc.addImage(schoolLogo, "PNG", logoX, logoY, logoWidth, logoHeight);
    } catch (e) {
      console.error("Error adding logo to PDF:", e);
    }

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CASE RECORD", doc.internal.pageSize.getWidth() / 2, y, {
      align: "center",
    });
    y += 15;

    // 1. Identification Data
    drawSectionHeader("Identification Data");
    drawField("Name of Student", student.name);
    drawField("Admission Number", student.admissionNumber);
    drawField("Date of Birth", student.dob);
    drawField("Age", student.age);
    drawField("Gender", student.gender);
    drawField("Education", student.class);
    drawField("Blood Group", student.bloodGroup);
    drawField("Religion", student.religion);
    drawField("Category", student.category);
    drawField("UD ID", student.ud_id);
    drawField("Aadhar Number", student.aadharNumber);

    // 2. Demographic Data
    drawSectionHeader("Demographic Data");
    drawField("Father's Name", student.fatherName);
    drawField("Father's Education", student.fatherEducation);
    drawField("Father's Occupation", student.fatherOccupation);
    drawField("Mother's Name", student.motherName);
    drawField("Mother's Education", student.motherEducation);
    drawField("Mother's Occupation", student.motherOccupation);
    drawField("Guardian's Name", student.guardianName);
    drawField("Guardian's Relationship", student.guardianRelationship);
    drawField("Guardian's Occupation", student.guardianOccupation);
    drawField("Total Family Income", student.totalFamilyIncome);
    drawField(
      "Address & Phone",
      student.address_and_phone ||
        `${student.address || ""}${student.phoneNumber ? " | " + student.phoneNumber : ""}`,
    );

    // 3. Informant Detail
    drawSectionHeader("Informant Detail");
    drawField("Informant Name", student.informantName);
    drawField("Informant Relationship", student.informantRelationship);
    drawField("Duration of Contact", student.durationOfContact);
    drawField("Present Complaints", student.presentComplaints);
    drawField(
      "Previous Consultation and Treatments",
      student.previousTreatments,
    );

    // 4. Family History
    drawSectionHeader("Family History");
    drawField("Mental Illness", student.familyHistory?.mental_illness);
    drawField("Mental Retardation", student.familyHistory?.mental_retardation);
    drawField("Epilepsy and Others", student.familyHistory?.epilepsy);

    // 5. Birth History
    drawSectionHeader("Birth History");
    drawField("Prenatal History", student.birthHistory?.prenatal);
    drawField("Natal / Neonatal History", student.birthHistory?.natal);
    drawField("Postnatal History", student.birthHistory?.postnatal);

    // 6. Developmental History
    drawSectionHeader("Developmental History");
    const dev = student.developmentHistory || {};
    const yesNo = (v) => (v ? "Yes" : "No");
    drawField("Smiles at others", yesNo(dev.smiles_at_other));
    drawField("Head control", yesNo(dev.head_control));
    drawField("Sitting", yesNo(dev.sitting));
    drawField("Responds to name", yesNo(dev.responds_to_name));
    drawField("Babbling", yesNo(dev.babbling));
    drawField("First words", yesNo(dev.first_words));
    drawField("Standing", yesNo(dev.standing));
    drawField("Walking", yesNo(dev.walking));
    drawField("Two-word phrases", yesNo(dev.two_word_phrases));
    drawField("Toilet control", yesNo(dev.toilet_control));
    drawField("Sentences", yesNo(dev.sentences));
    drawField("Physical deformity", yesNo(dev.physical_deformity));

    // 7. Special Education Assessment
    drawSectionHeader("Special Education Assessment");
    const assessment = student.assessment || {};

    drawSubHeader("Self Help / ADL");
    drawField("Eating Habits", assessment.self_help?.food_habits?.eating);
    drawField("Drinking Habits", assessment.self_help?.food_habits?.drinking);
    drawField("Toilet Habits", assessment.self_help?.toilet_habits);
    drawField("Brushing", assessment.self_help?.brushing);
    drawField("Bathing", assessment.self_help?.bathing);
    drawField(
      "Dressing (Removing/Wearing)",
      assessment.self_help?.dressing?.removing_and_wearing,
    );
    drawField(
      "Dressing (Buttoning)",
      assessment.self_help?.dressing?.buttoning,
    );
    drawField("Dressing (Footwear)", assessment.self_help?.dressing?.footwear);
    drawField("Grooming", assessment.self_help?.dressing?.grooming);

    drawSubHeader("Motor");
    drawField("Gross Motor", assessment.motor?.gross_motor);
    drawField("Fine Motor", assessment.motor?.fine_motor);

    drawSubHeader("Sensory");
    drawField("Sensory Skills", assessment.sensory);

    drawSubHeader("Socialization");
    drawField(
      "Language/Communication",
      assessment.socialization?.language_communication,
    );
    drawField("Social Behaviour", assessment.socialization?.social_behaviour);
    drawField("Mobility in Neighborhood", assessment.socialization?.mobility);

    drawSubHeader("Cognitive");
    drawField("Attention", assessment.cognitive?.attention);
    drawField(
      "Identification of Objects",
      assessment.cognitive?.identification_of_objects,
    );
    drawField("Use of Objects", assessment.cognitive?.use_of_objects);
    drawField(
      "Following Instruction",
      assessment.cognitive?.following_instruction,
    );
    drawField("Awareness of Danger", assessment.cognitive?.awareness_of_danger);
    drawField(
      "Concept - Color",
      assessment.cognitive?.concept_formation?.color,
    );
    drawField("Concept - Size", assessment.cognitive?.concept_formation?.size);
    drawField("Concept - Sex", assessment.cognitive?.concept_formation?.sex);
    drawField(
      "Concept - Shape",
      assessment.cognitive?.concept_formation?.shape,
    );
    drawField(
      "Concept - Number",
      assessment.cognitive?.concept_formation?.number,
    );
    drawField("Concept - Time", assessment.cognitive?.concept_formation?.time);
    drawField(
      "Concept - Money",
      assessment.cognitive?.concept_formation?.money,
    );

    drawSubHeader("Academic");
    drawField("Reading", assessment.academic?.reading);
    drawField("Writing", assessment.academic?.writing);
    drawField("Arithmetic", assessment.academic?.arithmetic);

    drawSubHeader("Prevocational / Domestic");
    drawField(
      "Ability & Interest",
      assessment.prevocational?.ability_and_interest,
    );
    drawField("Items of Interest", assessment.prevocational?.items_of_interest);
    drawField("Items of Dislike", assessment.prevocational?.items_of_dislike);

    drawSubHeader("Observations & Recommendations");
    drawField("Behaviour Problems", assessment.behaviour_problems);
    drawField("Any Other Information", assessment.any_other);
    drawField("Recommendation", assessment.recommendation);

    // 8. Medical, Allergies & Drug History
    drawSectionHeader("Medical, Allergies & Drug History");
    drawField("Medical conditions", student.medical_conditions);
    drawField("Specific diagnostic", student.specific_diagnostic);
    drawField(
      "Is on regular drugs",
      student.is_on_regular_drugs ? "Yes" : "No",
    );
    drawField("Drug allergy", student.drug_allergy);
    drawField("Food allergy", student.food_allergy);

    if (
      Array.isArray(student.drug_history) &&
      student.drug_history.length > 0
    ) {
      drawSubHeader("Drug History Details");
      student.drug_history.forEach((drug, idx) => {
        drawField(
          `Drug ${idx + 1}: ${drug.name || "Unnamed"}`,
          `Dose: ${drug.dose || "N/A"}`,
        );
      });
    }

    // Save with a clean filename
    const safeName = (student.name || "student").replace(/[^a-z0-9_-]/gi, "_");
    doc.save(`case-record_${safeName}.pdf`);
  };

  // Generate and download therapy summary report
  const handleGenerateSummaryReport = () => {
    if (!student) {
      alert("Student information not available. Please try again.");
      return;
    }

    if (generatingReport) {
      return; // Prevent multiple concurrent generations
    }

    // Validate date range
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      alert(
        "Start date cannot be later than end date. Please check your date selection.",
      );
      return;
    }

    setGeneratingReport(true);

    // Filter reports based on current filters
    const filtered = reports.filter((r) => {
      if (fromDate) {
        if (!r.report_date || new Date(r.report_date) < new Date(fromDate))
          return false;
      }
      if (toDate) {
        if (!r.report_date || new Date(r.report_date) > new Date(toDate))
          return false;
      }
      if (selectedTherapyType) {
        if (!r.therapy_type || r.therapy_type !== selectedTherapyType)
          return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      const filterDescription = [];
      if (fromDate) filterDescription.push(`start date: ${fromDate}`);
      if (toDate) filterDescription.push(`end date: ${toDate}`);
      if (selectedTherapyType)
        filterDescription.push(`therapy type: ${selectedTherapyType}`);

      const filterText =
        filterDescription.length > 0
          ? ` matching the selected criteria (${filterDescription.join(", ")})`
          : "";

      alert(
        `No therapy reports found${filterText}. Please adjust your filters or ensure therapy reports exist for this student.`,
      );
      setGeneratingReport(false);
      return;
    }

    try {
      const doc = new jsPDF();
      let y = 20;
      const pageHeight = doc.internal.pageSize.getHeight();
      const leftMargin = 15;
      const rightMargin = 15;
      const contentWidth =
        doc.internal.pageSize.getWidth() - leftMargin - rightMargin;
      const lineHeight = 6;

      const checkPageBreak = (neededHeight) => {
        if (y + neededHeight > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
      };

      const addText = (text, fontSize = 10, isBold = false) => {
        checkPageBreak(lineHeight + 2);
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line) => {
          checkPageBreak(lineHeight);
          doc.text(line, leftMargin, y);
          y += lineHeight;
        });
        y += 2; // Extra spacing
      };

      // Add school logo to top-right
      const logoWidth = 30;
      const logoHeight = 30;
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoX = pageWidth - logoWidth - rightMargin;
      const logoY = 10;
      try {
        doc.addImage(schoolLogo, "JPEG", logoX, logoY, logoWidth, logoHeight);
      } catch (logoError) {
        console.error("Error adding logo to PDF:", logoError);
        // Try again without format specification
        try {
          doc.addImage(schoolLogo, logoX, logoY, logoWidth, logoHeight);
        } catch (e2) {
          console.error("Second attempt to add logo failed:", e2);
        }
      }

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(
        "THERAPY SUMMARY REPORT",
        pageWidth / 2,
        y,
        { align: "center" },
      );
      y += 15;

      // Student Info
      addText(`Student Name: ${student.name || "N/A"}`, 12, true);
      addText(`Student ID: ${student.studentId || "N/A"}`, 10);
      addText(`Report Generated: ${new Date().toLocaleDateString()}`, 10);

      // Filter criteria
      y += 5;
      addText("Filter Criteria:", 12, true);
      if (fromDate) addText(`Start Date: ${fromDate}`, 10);
      if (toDate) addText(`End Date: ${toDate}`, 10);
      if (selectedTherapyType)
        addText(`Therapy Type: ${selectedTherapyType}`, 10);
      addText(`Total Reports: ${filtered.length}`, 10);

      y += 10;
      addText("SUMMARY OF THERAPY REPORTS", 14, true);
      y += 5;

      // Group reports by therapy type for summary
      const reportsByType = {};
      filtered.forEach((r) => {
        const type = r.therapy_type || "Unspecified";
        if (!reportsByType[type]) {
          reportsByType[type] = [];
        }
        reportsByType[type].push(r);
      });

      // Summary by therapy type
      Object.entries(reportsByType).forEach(([type, typeReports]) => {
        addText(`${type} (${typeReports.length} sessions)`, 12, true);
        y += 3;

        typeReports.forEach((report, index) => {
          addText(
            `Session ${index + 1} - ${new Date(report.report_date).toLocaleDateString()}`,
            11,
            true,
          );
          if (report.progress_level) {
            addText(`Progress Level: ${report.progress_level}`, 10);
          }

          // Display goals_achieved sections properly
          if (report.goals_achieved) {
            if (
              typeof report.goals_achieved === "object" &&
              !Array.isArray(report.goals_achieved)
            ) {
              // If it's an object with sections
              addText("Goals Achieved:", 10, true);
              Object.entries(report.goals_achieved).forEach(
                ([sectionKey, sectionData]) => {
                  // Format section title (e.g., "receptive_language" -> "Receptive Language")
                  const sectionTitle = sectionKey
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                  if (typeof sectionData === "object" && sectionData.notes) {
                    addText(`  ${sectionTitle}: ${sectionData.notes}`, 9);
                  } else if (typeof sectionData === "string") {
                    addText(`  ${sectionTitle}: ${sectionData}`, 9);
                  }
                },
              );
            } else {
              // If it's a simple string
              addText(`Goals Achieved: ${report.goals_achieved}`, 10);
            }
          }
          y += 5;
        });
        y += 5;
      });

      // Generate filename
      const dateRange =
        fromDate && toDate
          ? `_${fromDate}_to_${toDate}`
          : fromDate
            ? `_from_${fromDate}`
            : toDate
              ? `_to_${toDate}`
              : "";
      const therapyTypeStr = selectedTherapyType
        ? `_${selectedTherapyType.replace(/\s+/g, "_")}`
        : "";
      const safeName = (student.name || "student").replace(
        /[^a-z0-9_-]/gi,
        "_",
      );

      doc.save(`therapy_summary_${safeName}${dateRange}${therapyTypeStr}.pdf`);
      setShowSummary(false);
      setGeneratingReport(false);
    } catch (error) {
      console.error("Error generating therapy summary report:", error);
      alert("An error occurred while generating the report. Please try again.");
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f7f7f7]">
        <div className="text-2xl text-[#E38B52]">
          Loading student information...
        </div>
      </div>
    );
  }

  return (
    <div
      id="profile-to-download"
      className="min-h-screen w-full flex flex-col items-center bg-[#f7f7f7] relative overflow-hidden py-20"
    >

    {showDocumentDeleteConfirm && pendingDocumentDelete && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#FAF9F6] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
    
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete Document
            </h3>
    
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#170F49]">
                {pendingDocumentDelete.documentName}
              </span>
              ?
              <br />
              <span className="text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </p>
    
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDocumentDeleteConfirm(false);
                  setPendingDocumentDelete(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDocument}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {showIepDeleteConfirm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#FAF9F6] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
    
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete IEP Report
            </h3>
    
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#170F49]">{deletePendingIepKey}</span>?
              <br />
              <span className="text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </p>
    
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowIepDeleteConfirm(false);
                  setDeletePendingIepKey(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={performDeleteIepReport}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#FAF9F6] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
    
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Delete Table
            </h3>
    
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this table?
              <br />
              <span className="text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </p>
    
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePendingIndex(null);
                  showToast("Delete cancelled", "info");
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deletePendingIndex !== null) {
                    handleDeleteTable(deletePendingIndex);
                    showToast("Table deleted", "success");
                  }
                  setShowDeleteConfirm(false);
                  setDeletePendingIndex(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-8 right-8 z-[9999] animate-slide-in-right ${
            toast.type === "success"
              ? "bg-green-500"
              : toast.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
          } text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md`}
        >
          <div className="flex-shrink-0">
            {toast.type === "success" ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : toast.type === "error" ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast({ show: false, message: "", type: "" })}
            className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-8 left-8 bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-3 border border-white/20 hover:-translate-y-1 transition-all duration-200 flex items-center gap-2 z-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-40 w-[600px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float z-0" />
      <div className="absolute -bottom-32 right-40 w-[600px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-3000 z-0" />
      <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-float animation-delay-5000 z-0" />
      <div className="absolute top-0 -left-40 w-[500px] h-[600px] bg-[#E38B52] rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-float animation-delay-7000 z-0" />
      <div className="w-[90%] max-w-[1200px] mx-4 flex-1 flex flex-col">
        <h1 className="text-3xl font-bold text-[#170F49] mb-8 text-center font-baskervville">
          Student Information
        </h1>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-2 inline-flex gap-2 shadow-lg relative w-[925px]">
            {/* Active Tab Background */}
            <div
              className="absolute h-[calc(100%-8px)] top-[4px] transition-all duration-300 ease-in-out rounded-xl bg-[#E38B52] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
              style={{
                left:
                  activeTab === "student-details"
                    ? "4px"
                    : activeTab === "case-record"
                      ? "188px"
                      : activeTab === "therapy-reports"
                        ? "372px"
                        : activeTab === "iep"
                          ? "556px"
                          : "740px",
                width: "180px",
                background: "linear-gradient(135deg, #E38B52 0%, #E38B52 100%)",
              }}
            >
              {/* Animated particles */}
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <div className="particle-1"></div>
                <div className="particle-2"></div>
                <div className="particle-3"></div>
              </div>
            </div>

            {/* Student Details Tab */}
            <button
              onClick={() => {
                if (warnIfEditingIep()) return;
                if (unsavedTableIndex !== null) {
                  const editingTable = savedTables[unsavedTableIndex];
                  if (editingTable) {
                    const phaseToSave = editingTable.assessment_phase || "1st assmt";
                    if (phaseToSave !== "1st assmt") {
                      const dateVal = (editingTable.quarterEditDates || {})[phaseToSave];
                      if (!dateVal) {
                        showToast("Please enter the date before saving this quarter", "warning");
                        return;
                      }
                    }
              
                    handleSetTableEditable(editingTable, false);
                    setUnsavedTableIndex(null);
                  }
                }
              
                setActiveTab("student-details"); // or case-record / therapy-reports / iep / special-education
              }}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "student-details"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Student Details
            </button>

            {/* Case Record Tab */}
            <button
              onClick={() => {
                if (warnIfEditingIep()) return;
                if (unsavedTableIndex !== null) {
                  showToast("Save the current table before changing tabs", "warning");
                  return;
                }
                setActiveTab("case-record");
              }}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "case-record"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Case Record
            </button>

            {/* Therapy Reports Tab */}
            <button
              onClick={() => {
                if (warnIfEditingIep()) return;
                if (unsavedTableIndex !== null) {
                  showToast("Save the current table before changing tabs", "warning");
                  return;
                }
                setActiveTab("therapy-reports");
              }}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "therapy-reports"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Therapy Reports
            </button>
            {/* IEP Tab */}
            <button
              onClick={() => {
                if (warnIfEditingIep()) return;
                if (unsavedTableIndex !== null) {
                  showToast("Save the current table before changing tabs", "warning");
                  return;
                }
                setActiveTab("iep");
              }}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "iep"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              IEP
            </button>

            {/* Special Education Tab */}
            <button
              onClick={() => {
                if (warnIfEditingIep()) return;
                if (unsavedTableIndex !== null) {
                  showToast("Save the current table before changing tabs", "warning");
                  return;
                }
                setActiveTab("special-education");
              }}
              className={`w-[180px] px-6 py-3 rounded-xl font-medium transition-all duration-300 relative z-10 text-center whitespace-nowrap ${
                activeTab === "special-education"
                  ? "text-white"
                  : "text-[#170F49] hover:text-[#E38B52]"
              }`}
            >
              Special Education
            </button>
          </div>
        </div>
        

        {/* Main content container */}
        <div className="relative bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
          {activeTab === "therapy-reports" ? (
            <div className="w-full">
              <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-[#E38B52]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6"
                  />
                </svg>
                Therapy Reports
              </h2>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Center: AI Analysis Expanded */}
                <main className="w-full lg:w-4/6 flex-1 lg:px-4">
                  <div className="mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                    {/* Horizontal filter bar at the top */}
                    <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-4 w-full">
                      <div className="flex flex-col sm:flex-row flex-wrap items-end gap-6 flex-1">
                      <div className="flex flex-row items-center min-w-[140px] gap-2">
                        <span className="text-sm font-semibold text-gray-700">
                          Start Date
                        </span>
                        <div className="relative flex items-center h-10">
                          <input
                            ref={startDateRef}
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                              setFromDate(e.target.value);
                              setVisibleCount(5);
                            }}
                            className="w-[160px] h-10 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E38B52] focus:border-[#E38B52] text-sm text-gray-700 pl-10 pr-3 py-2 shadow-sm transition-all duration-200 cursor-pointer hover:bg-orange-50"
                            style={{ paddingLeft: "2.2rem" }}
                            aria-label="Start date"
                          />
                          <button
                            type="button"
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E38B52] focus:outline-none"
                            tabIndex={-1}
                            onClick={() =>
                              startDateRef.current &&
                              startDateRef.current.showPicker &&
                              startDateRef.current.showPicker()
                            }
                            aria-label="Open start date picker"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="4"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="white"
                              />
                              <path
                                d="M16 2v4M8 2v4M3 10h18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-row items-center min-w-[140px] gap-2">
                        <span className="text-sm font-semibold text-gray-700">
                          End Date
                        </span>
                        <div className="relative flex items-center h-10">
                          <input
                            ref={endDateRef}
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                              setToDate(e.target.value);
                              setVisibleCount(5);
                            }}
                            className="w-[160px] h-10 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E38B52] focus:border-[#E38B52] text-sm text-gray-700 pl-10 pr-3 py-2 shadow-sm transition-all duration-200 cursor-pointer hover:bg-orange-50"
                            style={{ paddingLeft: "2.2rem" }}
                            aria-label="End date"
                          />
                          <button
                            type="button"
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E38B52] focus:outline-none"
                            tabIndex={-1}
                            onClick={() =>
                              endDateRef.current &&
                              endDateRef.current.showPicker &&
                              endDateRef.current.showPicker()
                            }
                            aria-label="Open end date picker"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <rect
                                x="3"
                                y="4"
                                width="18"
                                height="18"
                                rx="4"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="white"
                              />
                              <path
                                d="M16 2v4M8 2v4M3 10h18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-row items-center min-w-[170px] gap-2">
                        <span className="text-sm font-semibold text-gray-700">
                          Therapy
                        </span>
                        <div className="relative flex items-center h-10 w-full">
                          <select
                            value={selectedTherapyType}
                            onChange={(e) => {
                              setSelectedTherapyType(e.target.value);
                              setVisibleCount(5);
                            }}
                            className="appearance-none w-full min-w-[110px] h-10 bg-white border border-gray-300 rounded-full focus:ring-2 focus:ring-[#E38B52] focus:border-[#E38B52] text-base text-gray-700 pl-9 pr-6 py-2 shadow-sm transition-all duration-200 cursor-pointer hover:bg-orange-50"
                            title="Filter by therapy type"
                            aria-label="Therapy type"
                          >
                            <option value="">All Types</option>
                            <option value="Behavioral Therapy">
                              Behavioral
                            </option>
                            <option value="Occupational Therapy">
                              Occupational
                            </option>
                            <option value="Physical Therapy">Physical</option>
                            <option value="Speech Therapy">Speech</option>
                          </select>
                          <svg
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-5 text-[#E38B52] pointer-events-none"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M6 9l6 6 6-6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </div>
                      </div>
                      <div className="flex flex-row items-end gap-2 lg:justify-end lg:min-w-[320px] lg:flex-shrink-0">
                        <button
                          onClick={() => {
                            setFromDate("");
                            setToDate("");
                            setSelectedTherapyType("");
                            setVisibleCount(5);
                          }}
                          disabled={!(fromDate || toDate || selectedTherapyType)}
                          className={`px-5 h-10 py-2 rounded-lg text-base font-semibold transition-all duration-200 shadow-md flex items-center ${
                            fromDate || toDate || selectedTherapyType
                              ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 hover:shadow-lg"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          Clear
                        </button>
                        {/* Stats Display with Count-up Animation (moved here) */}
                        {(() => {
                          // Calculate filtered reports based on current filters
                          const filteredReports = reports.filter((r) => {
                            if (fromDate) {
                              if (!r.report_date) return false;
                              const reportDate = new Date(r.report_date);
                              const filterFromDate = new Date(fromDate);
                              if (reportDate < filterFromDate) return false;
                            }
                            if (toDate) {
                              if (!r.report_date) return false;
                              const reportDate = new Date(r.report_date);
                              const filterToDate = new Date(toDate);
                              if (reportDate > filterToDate) return false;
                            }
                            if (selectedTherapyType) {
                              if (
                                !r.therapy_type ||
                                r.therapy_type.trim() !==
                                  selectedTherapyType.trim()
                              )
                                return false;
                            }
                            return true;
                          });
                          // Calculate days between dates
                          const daysBetween =
                            fromDate && toDate
                              ? Math.ceil(
                                  (new Date(toDate) - new Date(fromDate)) /
                                    (1000 * 60 * 60 * 24),
                                ) + 1
                              : 0;
                          const showStats =
                            filteredReports.length > 0 || (fromDate && toDate);
                          return (
                            showStats && (
                              <div className="flex items-center gap-2 ml-2">
                                {filteredReports.length > 0 && (
                                  <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
                                    <svg
                                      className="w-5 h-5 text-[#E38B52]"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                    <div className="text-gray-700">
                                      <div className="text-lg font-bold text-[#E38B52]">
                                        <CountUp
                                          end={filteredReports.length}
                                          duration={1500}
                                        />
                                      </div>
                                      <div className="text-xs font-medium text-gray-600">
                                        Reports
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {daysBetween > 0 && (
                                  <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
                                    <svg
                                      className="w-5 h-5 text-[#E38B52]"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <div className="text-gray-700">
                                      <div className="text-lg font-bold text-[#E38B52]">
                                        <CountUp
                                          end={daysBetween}
                                          duration={1500}
                                        />
                                      </div>
                                      <div className="text-xs font-medium text-gray-600">
                                        Days
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex flex-row gap-4 w-full mt-2">
                      <button
                        onClick={handleAISummarize}
                        disabled={aiSummarizing}
                        className={`flex-1 px-7 py-3 rounded-2xl text-white font-bold text-lg tracking-wide transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-3 border-2 border-[#E38B52] focus:ring-4 focus:ring-[#E38B52]/30 ${aiSummarizing ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-[#E38B52] to-[#D67A3F] hover:from-[#D67A3F] hover:to-[#C56930]"}`}
                      >
                        {aiSummarizing ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span>Analyzing with Llama 3.2 3B...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            <span>Generate AI Analysis</span>
                          </>
                        )}
                      </button>
                      {reports.length > 0 && (
                        <button
                          onClick={() => {
                            const filtered = reports.filter((r) => {
                              if (fromDate) {
                                if (!r.report_date) return false;
                                const reportDate = new Date(r.report_date);
                                const filterFromDate = new Date(fromDate);
                                if (reportDate < filterFromDate) return false;
                              }
                              if (toDate) {
                                if (!r.report_date) return false;
                                const reportDate = new Date(r.report_date);
                                const filterToDate = new Date(toDate);
                                if (reportDate > filterToDate) return false;
                              }
                              if (selectedTherapyType) {
                                if (
                                  !r.therapy_type ||
                                  r.therapy_type.trim() !==
                                    selectedTherapyType.trim()
                                )
                                  return false;
                              }
                              return true;
                            });

                            const pdf = new jsPDF();
                            const pageWidth = pdf.internal.pageSize.getWidth();
                            const pageHeight =
                              pdf.internal.pageSize.getHeight();
                            const marginLeft = 15;
                            const marginRight = 15;
                            let yPosition = 20;

                            // Add school logo to top-right
                            const logoWidth = 30;
                            const logoHeight = 30;
                            const logoX = pageWidth - logoWidth - marginRight;
                            const logoY = 10;
                            try {
                              pdf.addImage(schoolLogo, "JPEG", logoX, logoY, logoWidth, logoHeight);
                            } catch (logoError) {
                              console.error("Error adding logo to PDF:", logoError);
                              // Try again without format specification
                              try {
                                pdf.addImage(schoolLogo, logoX, logoY, logoWidth, logoHeight);
                              } catch (e2) {
                                console.error("Second attempt to add logo failed:", e2);
                              }
                            }

                            // Title
                            pdf.setFontSize(18);
                            pdf.setFont(undefined, "bold");
                            pdf.text(
                              `Therapy Reports - ${student?.name || "Student"}`,
                              marginLeft,
                              yPosition,
                            );
                            yPosition += 10;

                            // Date range
                            pdf.setFontSize(10);
                            pdf.setFont(undefined, "normal");
                            const dateRangeText =
                              fromDate || toDate
                                ? `Date Range: ${fromDate || "Start"} to ${toDate || "End"}`
                                : "All Reports";
                            pdf.text(dateRangeText, marginLeft, yPosition);
                            yPosition += 5;

                            if (selectedTherapyType) {
                              pdf.text(
                                `Therapy Type: ${selectedTherapyType}`,
                                marginLeft,
                                yPosition,
                              );
                              yPosition += 5;
                            }

                            pdf.text(
                              `Total Reports: ${filtered.length}`,
                              marginLeft,
                              yPosition,
                            );
                            yPosition += 10;

                            // Reports
                            filtered.forEach((report, index) => {
                              if (yPosition > pageHeight - 40) {
                                pdf.addPage();
                                yPosition = 20;
                              }

                              pdf.setFontSize(14);
                              pdf.setFont(undefined, "bold");
                              pdf.text(
                                `Report ${index + 1}`,
                                marginLeft,
                                yPosition,
                              );
                              yPosition += 8;

                              pdf.setFontSize(10);
                              pdf.setFont(undefined, "normal");

                              pdf.text(
                                `Date: ${new Date(report.report_date).toLocaleDateString()}`,
                                marginLeft,
                                yPosition,
                              );
                              yPosition += 5;

                              pdf.text(
                                `Therapy Type: ${report.therapy_type || "N/A"}`,
                                marginLeft,
                                yPosition,
                              );
                              yPosition += 5;

                              pdf.text(
                                `Therapist: ${report.therapist_name || "N/A"}`,
                                marginLeft,
                                yPosition,
                              );
                              yPosition += 5;

                              if (report.progress_level) {
                                pdf.text(
                                  `Progress Level: ${report.progress_level}`,
                                  marginLeft,
                                  yPosition,
                                );
                                yPosition += 5;
                              }

                              yPosition += 3;

                              const clinicalFields = [
                                ["Present Complaints", report.present_complaints],
                                ["Current Observation", report.current_observation],
                                ["Assessment Done", report.assessment_done],
                                ["Provisional Diagnosis", report.provisional_diagnosis],
                              ];

                              clinicalFields.forEach(([label, value]) => {
                                const text = typeof value === "string" ? value.trim() : value;
                                if (!text) {
                                  return;
                                }

                                if (yPosition > pageHeight - 20) {
                                  pdf.addPage();
                                  yPosition = 20;
                                }
                                pdf.setFont(undefined, "bold");
                                pdf.text(`${label}:`, marginLeft, yPosition);
                                yPosition += 5;
                                pdf.setFont(undefined, "normal");
                                const lines = pdf.splitTextToSize(
                                  String(value),
                                  pageWidth - marginLeft - marginRight,
                                );
                                lines.forEach((line) => {
                                  if (yPosition > pageHeight - 20) {
                                    pdf.addPage();
                                    yPosition = 20;
                                  }
                                  pdf.text(line, marginLeft + 5, yPosition);
                                  yPosition += 5;
                                });
                                yPosition += 3;
                              });

                              // Progress Notes
                              if (report.progress_notes) {
                                if (yPosition > pageHeight - 20) {
                                  pdf.addPage();
                                  yPosition = 20;
                                }
                                pdf.setFont(undefined, "bold");
                                pdf.text(
                                  "Progress Notes:",
                                  marginLeft,
                                  yPosition,
                                );
                                yPosition += 5;
                                pdf.setFont(undefined, "normal");
                                const progressLines = pdf.splitTextToSize(
                                  report.progress_notes,
                                  pageWidth - marginLeft - marginRight,
                                );
                                progressLines.forEach((line) => {
                                  if (yPosition > pageHeight - 20) {
                                    pdf.addPage();
                                    yPosition = 20;
                                  }
                                  pdf.text(line, marginLeft + 5, yPosition);
                                  yPosition += 5;
                                });
                                yPosition += 3;
                              }

                              // Goals Achieved - detailed breakdown of all sections
                              if (report.goals_achieved) {
                                if (yPosition > pageHeight - 20) {
                                  pdf.addPage();
                                  yPosition = 20;
                                }
                                pdf.setFont(undefined, "bold");
                                pdf.text(
                                  "Goals Achieved:",
                                  marginLeft,
                                  yPosition,
                                );
                                yPosition += 5;
                                pdf.setFont(undefined, "normal");

                                if (
                                  typeof report.goals_achieved === "object" &&
                                  !Array.isArray(report.goals_achieved)
                                ) {
                                  // Iterate through each section (e.g., receptive_language, expressive_language, etc.)
                                  Object.entries(report.goals_achieved).forEach(
                                    ([sectionKey, sectionData]) => {
                                      if (yPosition > pageHeight - 20) {
                                        pdf.addPage();
                                        yPosition = 20;
                                      }

                                      // Format section title (e.g., "receptive_language" -> "Receptive Language")
                                      const sectionTitle = sectionKey
                                        .split("_")
                                        .map(
                                          (word) =>
                                            word.charAt(0).toUpperCase() +
                                            word.slice(1),
                                        )
                                        .join(" ");

                                      pdf.setFont(undefined, "bold");
                                      pdf.text(
                                        ` ${sectionTitle}:`,
                                        marginLeft + 5,
                                        yPosition,
                                      );
                                      yPosition += 5;
                                      pdf.setFont(undefined, "normal");

                                      // Handle different data structures
                                      if (
                                        typeof sectionData === "object" &&
                                        sectionData !== null
                                      ) {
                                        // If it has a 'checked' property, show status
                                        if ("checked" in sectionData) {
                                          if (!sectionData.checked) {
                                            pdf.text(
                                              "No data entered",
                                              marginLeft + 10,
                                              yPosition,
                                            );
                                            yPosition += 5;
                                          }
                                        }

                                        // If it has notes, display them
                                        if (sectionData.notes) {
                                          const noteLines = pdf.splitTextToSize(
                                            `Notes: ${sectionData.notes}`,
                                            pageWidth -
                                              marginLeft -
                                              marginRight -
                                              15,
                                          );
                                          noteLines.forEach((line) => {
                                            if (yPosition > pageHeight - 20) {
                                              pdf.addPage();
                                              yPosition = 20;
                                            }
                                            pdf.text(
                                              line,
                                              marginLeft + 10,
                                              yPosition,
                                            );
                                            yPosition += 5;
                                          });
                                        }
                                      } else if (
                                        typeof sectionData === "string"
                                      ) {
                                        // Simple string value
                                        const dataLines = pdf.splitTextToSize(
                                          sectionData,
                                          pageWidth -
                                            marginLeft -
                                            marginRight -
                                            15,
                                        );
                                        dataLines.forEach((line) => {
                                          if (yPosition > pageHeight - 20) {
                                            pdf.addPage();
                                            yPosition = 20;
                                          }
                                          pdf.text(
                                            line,
                                            marginLeft + 10,
                                            yPosition,
                                          );
                                          yPosition += 5;
                                        });
                                      }

                                      yPosition += 2;
                                    },
                                  );
                                } else if (
                                  typeof report.goals_achieved === "string"
                                ) {
                                  // If goals_achieved is just a string
                                  const goalLines = pdf.splitTextToSize(
                                    report.goals_achieved,
                                    pageWidth - marginLeft - marginRight - 5,
                                  );
                                  goalLines.forEach((line) => {
                                    if (yPosition > pageHeight - 20) {
                                      pdf.addPage();
                                      yPosition = 20;
                                    }
                                    pdf.text(line, marginLeft + 5, yPosition);
                                    yPosition += 5;
                                  });
                                }
                                yPosition += 3;
                              }

                              // Challenges
                              if (report.challenges) {
                                if (yPosition > pageHeight - 20) {
                                  pdf.addPage();
                                  yPosition = 20;
                                }
                                pdf.setFont(undefined, "bold");
                                pdf.text("Challenges:", marginLeft, yPosition);
                                yPosition += 5;
                                pdf.setFont(undefined, "normal");
                                const challengeLines = pdf.splitTextToSize(
                                  report.challenges,
                                  pageWidth - marginLeft - marginRight,
                                );
                                challengeLines.forEach((line) => {
                                  if (yPosition > pageHeight - 20) {
                                    pdf.addPage();
                                    yPosition = 20;
                                  }
                                  pdf.text(line, marginLeft + 5, yPosition);
                                  yPosition += 5;
                                });
                                yPosition += 3;
                              }

                              // Recommendations (if available)
                              if (report.recommendations) {
                                if (yPosition > pageHeight - 20) {
                                  pdf.addPage();
                                  yPosition = 20;
                                }
                                pdf.setFont(undefined, "bold");
                                pdf.text(
                                  "Recommendations:",
                                  marginLeft,
                                  yPosition,
                                );
                                yPosition += 5;
                                pdf.setFont(undefined, "normal");
                                const recLines = pdf.splitTextToSize(
                                  report.recommendations,
                                  pageWidth - marginLeft - marginRight,
                                );
                                recLines.forEach((line) => {
                                  if (yPosition > pageHeight - 20) {
                                    pdf.addPage();
                                    yPosition = 20;
                                  }
                                  pdf.text(line, marginLeft + 5, yPosition);
                                  yPosition += 5;
                                });
                                yPosition += 3;
                              }

                              // Next Goals (if available)
                              if (report.next_goals) {
                                if (yPosition > pageHeight - 20) {
                                  pdf.addPage();
                                  yPosition = 20;
                                }
                                pdf.setFont(undefined, "bold");
                                pdf.text("Next Goals:", marginLeft, yPosition);
                                yPosition += 5;
                                pdf.setFont(undefined, "normal");
                                const nextGoalLines = pdf.splitTextToSize(
                                  report.next_goals,
                                  pageWidth - marginLeft - marginRight,
                                );
                                nextGoalLines.forEach((line) => {
                                  if (yPosition > pageHeight - 20) {
                                    pdf.addPage();
                                    yPosition = 20;
                                  }
                                  pdf.text(line, marginLeft + 5, yPosition);
                                  yPosition += 5;
                                });
                                yPosition += 3;
                              }

                              // Add a separator line between reports
                              if (yPosition > pageHeight - 20) {
                                pdf.addPage();
                                yPosition = 20;
                              }
                              pdf.setDrawColor(200, 200, 200);
                              pdf.line(
                                marginLeft,
                                yPosition,
                                pageWidth - marginRight,
                                yPosition,
                              );
                              yPosition += 8;
                            });

                            pdf.save(
                              `therapy_reports_${student?.name || "student"}_${new Date().toISOString().split("T")[0]}.pdf`,
                            );
                          }}
                          className="flex-1 px-7 py-3 border-2 border-[#E38B52] text-[#E38B52] text-lg rounded-2xl bg-white hover:bg-orange-50 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md font-bold"
                          title="Download filtered therapy reports"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 16v-8m0 8l-4-4m4 4l4-4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Download Reports
                        </button>
                      )}
                    </div>

                    {/* Stats Display with Count-up Animation */}
                    {(() => {
                      // Calculate filtered reports based on current filters
                      const filteredReports = reports.filter((r) => {
                        if (fromDate) {
                          if (!r.report_date) return false;
                          const reportDate = new Date(r.report_date);
                          const filterFromDate = new Date(fromDate);
                          if (reportDate < filterFromDate) return false;
                        }
                        if (toDate) {
                          if (!r.report_date) return false;
                          const reportDate = new Date(r.report_date);
                          const filterToDate = new Date(toDate);
                          if (reportDate > filterToDate) return false;
                        }
                        if (selectedTherapyType) {
                          if (
                            !r.therapy_type ||
                            r.therapy_type.trim() !== selectedTherapyType.trim()
                          )
                            return false;
                        }
                        return true;
                      });

                      // Calculate days between dates
                      const daysBetween =
                        fromDate && toDate
                          ? Math.ceil(
                              (new Date(toDate) - new Date(fromDate)) /
                                (1000 * 60 * 60 * 24),
                            ) + 1
                          : 0;

                      const showStats =
                        filteredReports.length > 0 || (fromDate && toDate);

                      // Removed duplicate stats display below filter bar
                      return null;
                    })()}

                    {aiSummaryError && (
                      <div className="p-2 mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                        {aiSummaryError}
                      </div>
                    )}
                    {aiSummarizing && (
                      <div className="text-sm text-gray-600 animate-pulse flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#E38B52] border-t-transparent rounded-full animate-spin"></div>
                        Generating summary... live typing in progress
                      </div>
                    )}
                    {(aiSummarizing || aiAnalysis || aiSummary) && (
                      <div className="mt-4 space-y-4 animate-fadeIn">
                        <div className="relative bg-gradient-to-br from-white via-orange-50/40 to-orange-100/60 backdrop-blur-sm p-8 rounded-2xl border border-[#E38B52]/30 shadow-md shadow-orange-100/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-200/40">
                          <h4 className="text-3xl font-extrabold text-[#C56930] mb-6 flex items-center gap-3 pb-3">
                            <svg
                              className="w-7 h-7 text-[#E38B52]"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                            Progress Summary
                            <svg
                              className="w-4 h-4 text-orange-400 cursor-help ml-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              title="AI-generated comprehensive analysis based on therapy reports"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {aiSummarizing && (
                              <button
                                onClick={handleStopAISummarize}
                                className="ml-auto px-3 py-2 border-2 border-red-400 text-red-700 text-sm rounded-xl bg-red-50 hover:bg-red-100 active:scale-95 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-semibold"
                                title="Stop summary generation"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <rect x="5" y="5" width="10" height="10" rx="1" />
                                </svg>
                                Stop
                              </button>
                            )}
                          </h4>

                          {(() => {
                            const filteredReports = getFilteredReportsForCurrentFilters();
                            const usedReports = aiAnalysis?.used_reports ?? filteredReports.length;
                            const startDate = aiAnalysis?.date_range?.start_date || fromDate || "All dates";
                            const endDate = aiAnalysis?.date_range?.end_date || toDate || "Current";
                            const therapyLabel = selectedTherapyType || "All therapies";

                            return (
                              <div className="mb-4 rounded-xl border border-orange-200 bg-white/80 px-4 py-2 text-xs sm:text-sm text-gray-700">
                                <span className="font-semibold text-[#B65E2A]">Based on {usedReports} reports</span>
                                <span className="mx-2 text-gray-400">|</span>
                                <span>Date range: {startDate} to {endDate}</span>
                                <span className="mx-2 text-gray-400">|</span>
                                <span>Therapy: {therapyLabel}</span>
                              </div>
                            );
                          })()}

                          <div className="text-sm text-gray-800 leading-relaxed max-h-96 overflow-auto max-w-none pr-1 rounded-xl border border-orange-100 bg-white/50">
                            {aiAnalysis && !aiSummarizing && (
                              <div className="sticky top-0 z-10 px-3 py-2 border-b border-orange-200 bg-white/95 backdrop-blur-sm">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={generateAIAnalysisPDF}
                                    className="px-3 py-2 border-2 border-[#E38B52] text-[#E38B52] text-xs sm:text-sm rounded-xl bg-white hover:bg-orange-50 active:scale-95 active:bg-orange-100 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-semibold"
                                    title="Download AI Analysis Report as PDF"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.2"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 16v-8m0 8l-4-4m4 4l4-4M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    Download
                                  </button>
                                  <button
                                    onClick={handleSendToParent}
                                    disabled={sendingToParent || sentToParent}
                                    className={`px-3 py-2 border-2 text-xs sm:text-sm rounded-xl active:scale-95 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-semibold disabled:opacity-60 disabled:cursor-not-allowed ${
                                      sentToParent
                                        ? "border-green-500 text-green-600 bg-green-50"
                                        : "border-[#E38B52] text-[#E38B52] bg-white hover:bg-orange-50 active:bg-orange-100"
                                    }`}
                                    title="Send this summary to the parent portal"
                                  >
                                    {sentToParent ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                    {sendingToParent ? "Sending..." : sentToParent ? "Sent" : "Send to Parent"}
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="p-3">
                            {translating ? (
                              <div className="flex items-center gap-2 text-gray-600">
                                <div className="w-4 h-4 border-2 border-[#E38B52] border-t-transparent rounded-full animate-spin"></div>
                                Translating to Malayalam...
                              </div>
                            ) : translatedSummary ? (
                              <div>
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-orange-200">
                                  <span className="text-xs font-semibold text-[#E38B52] uppercase">
                                    Translated (Malayalam)
                                  </span>
                                  <button
                                    onClick={() => {
                                      setTranslatedSummary(null);
                                    }}
                                    className="text-xs text-gray-500 hover:text-[#E38B52] underline"
                                  >
                                    Show Original
                                  </button>
                                </div>
                                <div className="whitespace-pre-wrap">
                                  {translatedSummary}
                                </div>
                              </div>
                            ) : (
                              renderSummaryContent(
                                aiSummarizing ? aiSummary : aiAnalysis?.summary,
                                aiSummarizing,
                              )
                            )}
                            </div>
                          </div>
                          {aiAnalysis?.truncated && (
                            <div className="mt-3 text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                              Ã¢Å¡Â Ã¯Â¸Â Analysis was truncated due to content length.
                              Consider filtering by date range for more detailed
                              analysis.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Previously Generated Summaries Section */}
                    {generatedSummaries.length > 0 && (
                      <div className="mt-8 space-y-3">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#E38B52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Previously Generated Summaries
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {generatedSummaries.slice(0, visibleCount).map((summary) => (
                            <details key={summary.id} className="bg-white rounded-lg border p-4 shadow-sm">
                              <summary className="flex justify-between items-center cursor-pointer">
                                <div>
                                  <div className="text-sm text-[#6F6C90]">{summary.generatedAt}</div>
                                  <div className="text-lg font-semibold text-[#170F49]">AI Summary</div>
                                  <div className="text-xs text-[#6F6C90]">
                                    Date Range: {summary.dateRange.start} to {summary.dateRange.end}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[#6F6C90] mr-2">{summary.reportCount} reports</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      // delete
                                      setGeneratedSummaries(prev => {
                                        const filtered = prev.filter(s => s.id !== summary.id);
                                        const summariesKey = `ai_summaries_student_${id}`;
                                        try {
                                          localStorage.setItem(summariesKey, JSON.stringify(filtered));
                                        } catch (err) {
                                          console.error("Failed to update localStorage:", err);
                                        }
                                        return filtered;
                                      });
                                    }}
                                    className="px-2 py-1 bg-red-50 border border-red-400 text-red-600 text-xs rounded-lg hover:bg-red-400 hover:text-white transition-all duration-200"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </summary>

                              <div className="mt-4 text-sm text-[#333] space-y-3">
                                <div className="text-xs text-[#6F6C90] font-semibold">Summary</div>
                                <div className="whitespace-pre-wrap text-sm text-gray-700">{summary.summary}</div>
                                <div className="text-xs text-[#6F6C90]">Generated: {summary.generatedAt}</div>
                                <div className="text-xs text-[#6F6C90]">Therapy: {summary.therapyType}</div>
                              </div>
                            </details>
                          ))}
                          {generatedSummaries.length > visibleCount && (
                            <div className="text-center mt-4">
                              <button
                                onClick={() => setVisibleCount((v) => v + 5)}
                                className="px-4 py-2 bg-[#E38B52] text-white rounded-md"
                              >
                                Load more
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </main>
              </div>
              {/* Reports Section at Bottom */}
              <div className="w-full mt-8">
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[#E38B52]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Therapy Reports
                    </h3>
                  </div>
                  {/* Active Filters Display */}
                  {(fromDate || toDate || selectedTherapyType) && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">
                        Active Filters:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {fromDate && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Start: {fromDate}
                          </span>
                        )}
                        {toDate && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            End: {toDate}
                          </span>
                        )}
                        {selectedTherapyType && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Type: {selectedTherapyType}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {reportsLoading ? (
                    <p className="text-sm text-[#6F6C90]">Loading reports...</p>
                  ) : reports.length === 0 ? (
                    <p className="text-sm text-[#6F6C90]">
                      No therapy reports found for this student.
                    </p>
                  ) : (
                    (() => {
                      const filtered = reports.filter((r) => {
                        if (fromDate) {
                          if (!r.report_date) return false;
                          const reportDate = new Date(r.report_date);
                          const filterFromDate = new Date(fromDate);
                          if (reportDate < filterFromDate) return false;
                        }
                        if (toDate) {
                          if (!r.report_date) return false;
                          const reportDate = new Date(r.report_date);
                          const filterToDate = new Date(toDate);
                          if (reportDate > filterToDate) return false;
                        }
                        if (selectedTherapyType) {
                          if (
                            !r.therapy_type ||
                            r.therapy_type.trim() !== selectedTherapyType.trim()
                          )
                            return false;
                        }
                        return true;
                      });
                      const visible = filtered.slice(0, visibleCount);
                      return (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                            <span className="text-sm text-[#6F6C90]">
                              Showing {Math.min(visibleCount, filtered.length)}{" "}
                              of {filtered.length} reports
                              {filtered.length !== reports.length &&
                                ` (filtered from ${reports.length} total)`}
                            </span>
                            {filtered.length > 0 && (
                              <span className="text-xs text-[#6F6C90]">
                                Date Range:{" "}
                                {filtered.length > 0
                                  ? `${new Date(Math.min(...filtered.map((r) => new Date(r.report_date)))).toLocaleDateString()} - ${new Date(Math.max(...filtered.map((r) => new Date(r.report_date)))).toLocaleDateString()}`
                                  : "No reports"}
                              </span>
                            )}
                          </div>
                          {visible.map((r) => (
                            <details
                              key={r.id}
                              className="bg-white rounded-lg border p-4 shadow-sm"
                            >
                              <summary className="flex justify-between items-center cursor-pointer">
                                <div>
                                  <div className="text-sm text-[#6F6C90]">
                                    {new Date(
                                      r.report_date,
                                    ).toLocaleDateString()}
                                  </div>
                                  <div className="text-lg font-semibold text-[#170F49]">
                                    {r.therapy_type || "Therapy"}
                                  </div>
                                </div>
                                <div className="text-sm text-[#6F6C90]">
                                  {r.progress_level || ""}
                                </div>
                              </summary>
                              <div className="mt-4 text-sm text-[#333] space-y-3">
                                {renderReportTextField(
                                  "Present Complaints",
                                  r.present_complaints,
                                )}
                                {renderReportTextField(
                                  "Current Observation",
                                  r.current_observation,
                                )}
                                {renderReportTextField(
                                  "Assessment Done",
                                  r.assessment_done,
                                )}
                                {renderReportTextField(
                                  "Provisional Diagnosis",
                                  r.provisional_diagnosis,
                                )}
                                {r.progress_notes && (
                                  <div>
                                    <div className="text-xs text-[#6F6C90]">
                                      Progress Notes
                                    </div>
                                    <div className="text-sm">
                                      {r.progress_notes}
                                    </div>
                                  </div>
                                )}
                                {r.goals_achieved && (
                                  <div>
                                    <div className="text-xs text-[#6F6C90] font-semibold mb-2">
                                      Goals Achieved
                                    </div>
                                    <div className="space-y-2">
                                      {typeof r.goals_achieved === "object" ? (
                                        Object.entries(r.goals_achieved).map(
                                          ([key, goal]) => (
                                            <div
                                              key={key}
                                              className="bg-gray-50 p-2 rounded border-l-2 border-[#E38B52]"
                                            >
                                              <div className="flex items-start gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={
                                                    goal.checked || false
                                                  }
                                                  disabled
                                                  className="mt-1 w-4 h-4 text-[#E38B52] rounded"
                                                />
                                                <div className="flex-1">
                                                  <div className="font-medium text-sm text-[#170F49]">
                                                    {key
                                                      .split("_")
                                                      .map(
                                                        (word) =>
                                                          word
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                          word.slice(1),
                                                      )
                                                      .join(" ")}
                                                  </div>
                                                  {goal.notes && (
                                                    <div className="text-xs text-[#6F6C90] mt-1 italic">
                                                      {goal.notes}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          ),
                                        )
                                      ) : (
                                        <div className="text-sm text-[#666]">
                                          {String(r.goals_achieved)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="text-xs text-[#6F6C90]">
                                  Recorded
                                </div>
                                <div className="text-sm">
                                  {new Date(r.created_at).toLocaleString()}
                                </div>
                              </div>
                            </details>
                          ))}
                          {filtered.length > visibleCount && (
                            <div className="text-center mt-4">
                              <button
                                onClick={() => setVisibleCount((v) => v + 5)}
                                className="px-4 py-2 bg-[#E38B52] text-white rounded-md"
                              >
                                Load more
                              </button>
                            </div>
                          )}
                          {filtered.length === 0 && (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 text-gray-400 mx-auto mb-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <p className="text-lg font-medium text-gray-900 mb-2">
                                No reports found
                              </p>
                              <p className="text-sm text-gray-500">
                                {fromDate || toDate || selectedTherapyType
                                  ? "Try adjusting your filters or clearing them to see all reports."
                                  : "No therapy reports are available for this student."}
                              </p>
                              {(fromDate || toDate || selectedTherapyType) && (
                                <button
                                  onClick={() => {
                                    setFromDate("");
                                    setToDate("");
                                    setSelectedTherapyType("");
                                    setVisibleCount(5);
                                  }}
                                  className="mt-4 px-4 py-2 bg-[#E38B52] text-white rounded-md hover:bg-[#D67A3F] transition-colors duration-200"
                                >
                                  Clear Filters
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "student-details" ? (
            <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center justify-between">
              {/* Main Header */}
              <h2 className="text-2xl font-bold text-[#170F49] flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-[#E38B52]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Student Details
              </h2>
          
              {/* Edit Button */}
              
                {!editMode ? (
                  <button
                    onClick={handleEditStart}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#E38B52] to-[#F5A572] text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Edit Student
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleEditSave}
                      className="px-6 py-2.5 bg-green-500 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:bg-green-600 flex items-center gap-2"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Save Changes
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="px-6 py-2.5 bg-gray-400 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
          
              {/* Personal Information Section */}
              <div className="mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                <h3 className="text-lg font-semibold text-[#170F49] mb-6 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#E38B52]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Personal Information
                </h3>
          
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Photo Section */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-white/50 shadow-xl">
                      <img
                        src={
                          photoPreview ||
                          student?.photoUrl ||
                          "https://placehold.co/200x200/EFEFEF/AAAAAA?text=No+Photo"
                        }
                        alt="Student"
                        className="w-full h-full object-cover"
                      />
                    </div>
          
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/png, image/jpeg"
                      style={{ display: "none" }}
                    />
          
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current.click()}
                        className="p-2.5 bg-white rounded-lg border border-[#E38B52]/30 hover:bg-[#E38B52] hover:border-[#E38B52] transition-all duration-200 shadow-md group"
                        title="Upload Photo"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-600 group-hover:text-white transition-colors duration-200"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </button>
          
                      {(student?.photoUrl || photoPreview) && (
                        <button
                          onClick={() => {
                            if (photoPreview) {
                              URL.revokeObjectURL(photoPreview);
                              setPhotoPreview(null);
                              setPhotoFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = null;
                            }
                          }}
                          className="p-2.5 bg-white rounded-lg border border-red-500/30 hover:bg-red-500 hover:border-red-500 transition-all duration-200 shadow-md group"
                          title="Delete Photo"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-600 group-hover:text-white transition-colors duration-200"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
          
                    {photoFile && (
                      <button
                        onClick={handlePhotoUpload}
                        disabled={photoUploading}
                        className={`mt-2 px-4 py-2 text-white text-sm rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${
                          photoUploading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {photoUploading ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Save Photo
                          </>
                        )}
                      </button>
                    )}
                  </div>
          
                  {/* Details Grid */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { label: "Full Name", key: "name", type: "text" },
                      { label: "Age", key: "age", type: "number" },
                      { label: "Student ID", key: "studentId", type: "text", readOnly: true },
                      { label: "Date of Birth", key: "dob", type: "date" },
                      { label: "Gender", key: "gender", options: GENDER_OPTIONS },
                      { label: "Religion", key: "religion", options: RELIGION_OPTIONS },
                      { label: "Caste", key: "caste", type: "text" },
                      { label: "Category", key: "category", options: CATEGORY_OPTIONS },
                      { label: "UD ID", key: "ud_id", type: "text" },
                      { label: "Aadhar Number", key: "aadharNumber", type: "text" },
                    ].map((field) => (
                      <div key={field.key}>
                        <p className="text-sm text-[#6F6C90] mb-2 font-semibold">{field.label}</p>
                        {editMode ? (
                          field.options ? (
                            <select
                              name={field.key}
                              value={editData?.[field.key] || ""}
                              onChange={handleEditSelectChange(field.key)}
                              className="input-edit"
                            >
                              <option value="">Select</option>
                              {field.options.map((option) => {
                                const optionValue = typeof option === "string" ? option : option.value;
                                const optionLabel = typeof option === "string" ? option : option.label;
                                return (
                                  <option key={optionValue} value={optionValue}>
                                    {optionLabel}
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              name={field.key}
                              value={editData?.[field.key] || ""}
                              onChange={handleEditChange}
                              readOnly={field.readOnly}
                              className="input-edit"
                            />
                          )
                        ) : (
                          <p className="text-[#170F49] font-medium text-lg">
                            {student?.[field.key] || "N/A"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
          
                {aadharEditError && (
                  <p className="text-red-500 text-sm mt-4">{aadharEditError}</p>
                )}
              </div>
          
              {/* Address Information Section */}
              <div className="mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                <h3 className="text-lg font-semibold text-[#170F49] mb-6 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#E38B52]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Address Information
                </h3>
          
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Birth Place", key: "birthPlace" },
                    { label: "House Name", key: "houseName" },
                    { label: "Block Panchayat", key: "blockPanchayat" },
                    { label: "Local Body", key: "localBody" },
                    { label: "Taluk", key: "taluk" },
                    { label: "Street Name", key: "streetName" },
                    { label: "Post Office", key: "postOffice" },
                    { label: "Pin Code", key: "pinCode" },
                    { label: "Revenue District", key: "revenueDistrict" },
                  ].map((field) => (
                    <div key={field.key}>
                      <p className="text-sm text-[#6F6C90] mb-2 font-semibold">{field.label}</p>
                      {editMode ? (
                        <input
                          type="text"
                          name={field.key}
                          value={editData?.[field.key] || ""}
                          onChange={handleEditChange}
                          className="input-edit"
                        />
                      ) : (
                        <p className="text-[#170F49] font-medium">{student?.[field.key] || "N/A"}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
          
              {/* Contact Information Section */}
              <div className="mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                <h3 className="text-lg font-semibold text-[#170F49] mb-6 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#E38B52]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Contact Information
                </h3>
          
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Phone Number", key: "phoneNumber" },
                    { label: "Email", key: "email" },
                    { label: "Address", key: "address" },
                  ].map((field) => (
                    <div key={field.key}>
                      <p className="text-sm text-[#6F6C90] mb-2 font-semibold">{field.label}</p>
                      {editMode ? (
                        <input
                          type={field.key === "email" ? "email" : "text"}
                          name={field.key}
                          value={editData?.[field.key] || ""}
                          onChange={handleEditChange}
                          className="input-edit"
                        />
                      ) : (
                        <p className="text-[#170F49] font-medium">{student?.[field.key] || "N/A"}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
          
              {/* Family Information Section */}
              <div className="mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                <h3 className="text-lg font-semibold text-[#170F49] mb-6 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#E38B52]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  Family Information
                </h3>
          
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Father's Name", key: "fatherName" },
                    { label: "Mother's Name", key: "motherName" },
                  ].map((field) => (
                    <div key={field.key}>
                      <p className="text-sm text-[#6F6C90] mb-2 font-semibold">{field.label}</p>
                      {editMode ? (
                        <input
                          type="text"
                          name={field.key}
                          value={editData?.[field.key] || ""}
                          onChange={handleEditChange}
                          className="input-edit"
                        />
                      ) : (
                        <p className="text-[#170F49] font-medium">{student?.[field.key] || "N/A"}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
          
              {/* Disability Details Section */}
              <div className="mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                <h3 className="text-lg font-semibold text-[#170F49] mb-6 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#E38B52]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Disability Details
                </h3>
          
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Type of Disability", key: "disabilityType" },
                    { label: "Percentage of Disability", key: "disabilityPercentage", suffix: "%" },
                  ].map((field) => (
                    <div key={field.key}>
                      <p className="text-sm text-[#6F6C90] mb-2 font-semibold">{field.label}</p>
                      {editMode ? (
                        <input
                          type={field.key === "disabilityPercentage" ? "number" : "text"}
                          name={field.key}
                          value={editData?.[field.key] || ""}
                          onChange={handleEditChange}
                          className="input-edit"
                        />
                      ) : (
                        <p className="text-[#170F49] font-medium">
                          {student?.[field.key] ? `${student[field.key]}${field.suffix || ""}` : "N/A"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
          
                <div className="mt-6">
                  <p className="text-sm text-[#6F6C90] mb-2 font-semibold">Identification Marks</p>
                  {editMode ? (
                    <textarea
                      name="identificationMarks"
                      value={editData?.identificationMarks || ""}
                      onChange={handleEditChange}
                      className="input-edit w-full"
                      rows="3"
                    />
                  ) : (
                    <p className="text-[#170F49] font-medium">{student?.identificationMarks || "N/A"}</p>
                  )}
                </div>
              </div>
          
              {/* Academic Information Section */}
              <div className="mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                <h3 className="text-lg font-semibold text-[#170F49] mb-6 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#E38B52]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z"
                    />
                  </svg>
                  Academic Information
                </h3>
          
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Class", key: "class", options: CLASS_OPTIONS },
                    { label: "Division", key: "division", options: DIVISION_OPTIONS },
                    { label: "Roll Number", key: "rollNo" },
                    { label: "Academic Year", key: "academicYear" },
                    { label: "Admission Number", key: "admissionNumber" },
                    { label: "Date of Admission", key: "admissionDate", type: "date" },
                  ].map((field) => (
                    <div key={field.key}>
                      <p className="text-sm text-[#6F6C90] mb-2 font-semibold">{field.label}</p>
                      {editMode ? (
                        field.options ? (
                          <select
                            name={field.key}
                            value={editData?.[field.key] || ""}
                            onChange={handleEditSelectChange(field.key)}
                            className="input-edit"
                          >
                            <option value="">Select</option>
                            {field.options.map((option) => {
                              const optionValue = typeof option === "string" ? option : option.value;
                              const optionLabel = typeof option === "string" ? option : option.label;
                              return (
                                <option key={optionValue} value={optionValue}>
                                  {optionLabel}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <input
                            type={field.type || "text"}
                            name={field.key}
                            value={editData?.[field.key] || ""}
                            onChange={handleEditChange}
                            className="input-edit"
                          />
                        )
                      ) : (

                        <p className="text-[#170F49] font-medium">
                          {student?.[field.key] || "N/A"}
                        </p>

                      )}
                    </div>
                  ))}
                </div>
              </div>
          
              {/* Bank Details Section */}
              <div className="mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                <h3 className="text-lg font-semibold text-[#170F49] mb-6 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#E38B52]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Bank Details
                </h3>
          
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Account Number", key: "accountNumber" },
                    { label: "Bank Name", key: "bankName" },
                    { label: "Branch", key: "branch" },
                    { label: "IFSC Code", key: "ifscCode" },
                  ].map((field) => (
                    <div key={field.key}>
                      <p className="text-sm text-[#6F6C90] mb-2 font-semibold">{field.label}</p>
                      {editMode ? (
                        <input
                          type="text"
                          name={field.key}
                          value={editData?.[field.key] || ""}
                          onChange={handleEditChange}
                          className="input-edit"
                        />
                      ) : (
                        <p className="text-[#170F49] font-medium">{student?.[field.key] || "N/A"}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
          
              {/* Certificates & Documents Section */}
              <div className="p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                <h3 className="text-lg font-semibold text-[#170F49] mb-6 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#E38B52]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Certificates & Documents
                </h3>

                {/* Document Types Upload Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    { id: "aadhar", label: "Aadhar" },
                    { id: "birth_certificate", label: "Birth Certificate" },
                    { id: "disability_certificate", label: "Disability Certificate" },
                    { id: "ration_card", label: "Ration Card" },
                    { id: "unique_disability", label: "UDID Card" },
                    { id: "hospital_assessment", label: "Medical Reports" },
                    { id: "passbook", label: "Passbook" },
                    { id: "nish_assessment", label: "Assessment Report" },
                  ].map((docType) => (
                    <div
                      key={docType.id}
                      className="p-4 bg-white/70 rounded-xl border border-[#E38B52]/20 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#E38B52"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <p className="font-medium text-[#170F49] text-sm">{docType.label}</p>
                          </div>
                          <p className="text-xs text-[#6F6C90]">PDF only Ã¢â‚¬Â¢ Max 5MB</p>
                        </div>
                                                
                        <button
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = ".pdf,.png,.jpg,.jpeg";
                            input.onchange = (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  showToast("File size exceeds 5MB", "error");
                                  return;
                                }
                                const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
                                const fileType = (file.type || "").toLowerCase();
                                const fileName = (file.name || "").toLowerCase();
                                if (!allowedTypes.includes(fileType) && !fileName.match(/\.(pdf|png|jpg|jpeg)$/)) {
                                  showToast("Only PDF, PNG, JPG, or JPEG files allowed", "error");
                                  return;
                                }
                                handleDocumentTypeUpload(file, docType.id, docType.label);
                              }
                            };
                            input.click();
                          }}
                          className="px-3 py-2 bg-gradient-to-r from-[#E38B52] to-[#F5A572] text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm whitespace-nowrap"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          {uploadedDocTypes[docType.id] ? "Uploaded" : "Upload"}
                        </button>

                        {uploadedDocumentsByType[docType.id]?.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => handleViewDocument(uploadedDocumentsByType[docType.id][0].id, uploadedDocumentsByType[docType.id][0].name)}
                              className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg transition-all duration-200 font-medium text-sm"
                              title={`View ${docType.label}`}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadDocument(uploadedDocumentsByType[docType.id][0].id, uploadedDocumentsByType[docType.id][0].name)}
                              className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 rounded-lg transition-all duration-200 font-medium text-sm"
                              title={`Download ${docType.label}`}
                            >
                              Download
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                                {/* Documents List */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-[#170F49] mb-4">Uploaded Documents</h4>
                                    {documentsLoading ? (
                    <div className="text-center py-8 text-[#6F6C90]">
                      Loading documents...
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <svg
                        className="mx-auto h-16 w-16 text-gray-300 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-[#6F6C90] text-sm">No documents uploaded yet</p>
                      <p className="text-xs text-[#6F6C90] mt-2">Upload documents from the grid above</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(documentsByCategory).map(([categoryLabel, docsInCategory]) => (
                        <div key={categoryLabel} className="space-y-3">
                          <h5 className="text-sm font-semibold text-[#170F49]">{categoryLabel}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {docsInCategory.map((doc) => (
                              <div
                                key={doc.id}
                                className="group p-5 bg-gradient-to-br from-white to-orange-50/30 rounded-xl border border-[#E38B52]/20 hover:border-[#E38B52]/40 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                              >
                                <div className="flex items-start gap-3 mb-4">
                                  <div className="p-3 bg-[#E38B52]/10 rounded-lg group-hover:bg-[#E38B52]/20 transition-colors duration-200">
                                    <svg
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="#E38B52"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                      <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p
                                      className="font-semibold text-[#170F49] text-sm truncate"
                                      title={`${getDocumentLabel(doc)} - ${doc.name}`}
                                    >
                                      {getDocumentLabel(doc)}
                                    </p>
                                    <p className="text-xs text-[#6F6C90] mt-1 truncate" title={doc.name}>
                                      {doc.name}
                                    </p>
                                    <p className="text-xs text-[#6F6C90] mt-1">
                                      {(doc.file_size / 1024).toFixed(2)} KB Ã¢â‚¬Â¢ {new Date(doc.upload_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleViewDocument(doc.id, doc.name)}
                                    className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2"
                                    title="View"
                                  >
                                    View
                                  </button>

                                  <button
                                    onClick={() => handleDownloadDocument(doc.id, doc.name)}
                                    className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700 rounded-lg transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2"
                                    title="Download"
                                  >
                                    Download
                                  </button>

                                  <button
                                    onClick={() =>
                                      confirmDeleteDocument(
                                        doc.id,
                                        doc.name,
                                        getDocumentTypeId(doc),
                                      )
                                    }
                                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-all duration-200 font-medium text-sm"
                                    title="Delete"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {previewDocument && (
                  <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center px-4 py-6">
                    <div className="w-full max-w-5xl rounded-3xl bg-white shadow-2xl overflow-hidden">
                      <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#E38B52]">Document Preview</p>
                          <h4 className="text-lg font-bold text-[#170F49] truncate" title={previewDocument.name}>
                            {previewDocument.name}
                          </h4>
                          <p className="text-xs text-gray-500">{previewDocument.mimeType}</p>
                        </div>
                        <button
                          type="button"
                          onClick={closeDocumentPreview}
                          className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                        >
                          Close
                        </button>
                      </div>
                      <div className="bg-gray-50 p-4">
                        {previewDocument.mimeType.startsWith("image/") ? (
                          <div className="flex justify-center">
                            <img
                              src={previewDocument.url}
                              alt={previewDocument.name}
                              className="max-h-[75vh] w-auto max-w-full rounded-2xl border border-gray-200 bg-white object-contain"
                            />
                          </div>
                        ) : (
                          <iframe
                            title={previewDocument.name}
                            src={previewDocument.url}
                            className="h-[75vh] w-full rounded-2xl border border-gray-200 bg-white"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "iep" ? (
                        
            <div className="max-w-6xl mx-auto p-6">
              
              <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0-8l-3 3m3-3l3 3M4 6h16" />
                </svg>
                Individual Education Program
              </h2>
            
              <div className="mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                <h3 className="text-lg font-semibold text-[#170F49] mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#E38B52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  IEP Report of: <span className="font-semibold ml-1">{student?.name}</span>
                </h3>

                
            
                {/* Month and Year selector */}
                  
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* Month Selector */}
                    <div className="flex items-center gap-3">
                      <label className="block text-sm font-semibold text-[#170F49] whitespace-nowrap">Select Month</label>
                      <select
                        value={iepData.selectedMonth || ""}
                        onChange={(e) => handleIepMonthChange(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-[#E38B52]/25 bg-white/90 text-[#170F49] font-medium"
                      >
                        <option value="">Choose a month</option>
                        {MONTHS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="block text-sm font-semibold text-[#170F49] whitespace-nowrap">
                        Year
                      </label>
                      <input
                        type="number"
                        min="1900"
                        max="2100"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-[#E38B52]/25 bg-white/90 text-[#170F49] font-medium w-28"
                      />
                    </div>
                  
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={createIepTable}
                      disabled={!iepData.selectedMonth || !selectedYear || !isValidYear}
                      className={`px-6 py-2.5 border rounded-lg transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap ${
                        iepData.selectedMonth && selectedYear && isValidYear
                          ? "bg-white text-[#E38B52] border-[#E38B52] hover:bg-[#FFF3E8]"
                          : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                      }`}
                    >
                      + Create Report
                    </button>
                    {existingIepMonthKey && (
                      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                        <p className="text-sm text-amber-900">
                          A report already exists for <strong>{existingIepMonthKey}</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIepFormVisible(false);
                            setExpandedIepMonth(existingIepMonthKey);
                            document
                              .getElementById(`iep-report-${existingIepMonthKey}`)
                              ?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          className="px-4 py-2 rounded-lg bg-[#E38B52] text-white text-sm hover:bg-[#C8742F]"
                        >
                          Go to saved report
                        </button>
                      </div>
                    )}
                  </div>
                <p className="mt-3 text-xs text-[#6F6C90]">Select the month and year to prepare the IEP report.</p>
              
                
              </div>
              <tbody>
              <tr>
                <td colSpan={3} className="p-4 align-top">
                  {iepFormVisible ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { key: "adlSkills", title: "ADL Skills", addLabel: "Add ADL Skill" },
                        { key: "academic", title: "Academic", addLabel: "Add Academic Entry" },
                        { key: "behaviouralSkills", title: "Behavioural", addLabel: "Add Behavioural Skill" },
                      ].map(({ key, title, addLabel }) => (
                        <div key={key} className="bg-white p-3 rounded shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{title}</h4>
                            <button
                              type="button"
                              className="text-sm text-[#E38B52] hover:underline"
                              onClick={() => addIepSectionItem(key)}
                            >
                              + {addLabel}
                            </button>
                          </div>
            
                          <div className="flex flex-col gap-2">
                            {(iepData.sections[key] || []).map((item) => (
                              <div key={item.id} className="flex gap-2 items-start">
                                <textarea
                                  value={item.text}
                                  onChange={(e) =>
                                    handleIepSectionChange(key, item.id, e.target.value)
                                  }
                                  placeholder="Enter item"
                                  className="input-edit h-20 resize-none"
                                />
                                <button
                                  type="button"
                                  className="text-red-500 ml-1"
                                  onClick={() => removeIepSectionItem(key, item.id)}
                                  aria-label="Remove item"
                                >
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4h8v2" />
                                    <path d="M6 6l1 14h10l1-14" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            {!(iepData.sections[key] || []).length && (
                              <div className="text-sm text-gray-400">No items yet</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const adlItems = Array.isArray(iepData.sections?.adlSkills) ? iepData.sections.adlSkills : [];
                        const academicItems = Array.isArray(iepData.sections?.academic) ? iepData.sections.academic : [];
                        const behaviouralItems = Array.isArray(iepData.sections?.behaviouralSkills) ? iepData.sections.behaviouralSkills : [];
                        const rowCount = Math.max(adlItems.length, academicItems.length, behaviouralItems.length);
                    
                       
                    
                        
                      })()}
                    </>
                  )}
                </td>
              </tr>
            </tbody>

              {pendingNewIepMonth && editingIepMonth === pendingNewIepMonth && renderIepDraftCard()}

              {/* Saved IEP Reports List */}
                <div className="mt-6 mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                  <h3 className="text-lg font-semibold text-[#170F49] mb-4 flex items-center gap-2">Saved Reports</h3>
                  {(() => {
                    const keys = Object.keys(savedIepByMonth || {});
                    const sortedKeys = keys.sort((a, b) => parseMonthYearKey(b) - parseMonthYearKey(a)); // newest first
                    return sortedKeys.map((monthYearKey) => {
                      const isExpanded = expandedIepMonth === monthYearKey;
                      const isEditing = editingIepMonth === monthYearKey;
                      return (
                        <div
                          key={monthYearKey}
                          id={`iep-report-${monthYearKey}`}
                          className="border border-[#E38B52]/30 rounded-xl bg-white shadow-md overflow-hidden"
                        >
                          <div className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-[#E38B52]/10 to-transparent">
                            <button
                              onClick={() => {
                                if (warnIfEditingIep() && !isExpanded) return;
                                toggleIepExpand(monthYearKey);
                              }}
                              className="text-left flex-1 text-base font-semibold text-[#170F49]"
                              aria-expanded={isExpanded}
                            >
                              TRIMESTER REPORT FOR {monthYearKey.toUpperCase()}
                            </button>
                  
                            <div className="flex items-center gap-2">
                              
                  
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); saveIepData(); }}
                                    className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm hover:bg-green-700"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const key = `iep_data_student_${id}_by_month`;
                                      try {
                                        const mapping = JSON.parse(localStorage.getItem(key) || "{}");
                                        if (mapping?.[monthYearKey]) {
                                          setIepData(normalizeIepData(savedIepByMonth[monthYearKey]));
                                        } else {
                                          setIepData({
                                            ...createEmptyIepData(),
                                            selectedMonth: iepData.selectedMonth,
                                          });
                                        }
                                      } catch (err) {
                                        console.error("Failed to reload IEP on cancel:", err);
                                      } finally {
                                        setEditingIepMonth(null);
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-md bg-gray-100 text-[#170F49] text-sm hover:bg-gray-200"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (warnIfEditingIep()) return;
                                    setExpandedIepMonth(monthYearKey);
                                    setEditingIepMonth(monthYearKey);
                                    setIepData(normalizeIepData(savedIepByMonth[monthYearKey]));
                                  }}
                                  className="px-3 py-1.5 rounded-md bg-[#E38B52] text-white text-sm hover:bg-[#C8742F]"
                                >
                                  Edit
                                </button>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Download the saved IEP for this month (uses existing helper)
                                  if (!savedIepByMonth?.[monthYearKey]) {
                                    showToast("No saved report to download.", "warning");
                                    return;
                                  }
                                  // If downloadIepAsPDF currently uses in-memory iepData, temporarily set it:
                                  
                                  downloadIepAsPDF(savedIepByMonth[monthYearKey]);
                                }}
                                title="Download report"
                                className="p-2 rounded-md text-[#E38B52] hover:bg-[#FFF3E8]"
                                aria-label="Download report"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l4-4m-4 4l-4-4M21 21H3" />
                                </svg>
                              </button>
                  
                              <button
                                onClick={(e) => { e.stopPropagation(); confirmDeleteIepReport(monthYearKey); }}
                                title="Delete report"
                                className="p-2 rounded-md text-red-600 hover:bg-red-50"
                                aria-label="Delete report"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                </svg>
                              </button>
                            </div>
                          </div>
                  
                          {isExpanded && (
                          <div className="px-6 py-6 border-t border-[#E38B52]/20 space-y-6 bg-white/50">
                            {/* Table Section */}
                            {isEditing ? (
                              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="w-full table-fixed border-collapse">
                                  <colgroup>
                                    <col style={{ width: "34%" }} />
                                    <col style={{ width: "33%" }} />
                                    <col style={{ width: "33%" }} />
                                  </colgroup>
                            
                                  <thead className="bg-gradient-to-r from-[#E38B52] to-[#F5A572]">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-white/30">
                                        <div className="flex items-center justify-between gap-3">
                                          <span>ADL SKILLS</span>
                                          <button
                                            type="button"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white text-[#E38B52] text-xs font-semibold shadow-sm hover:bg-[#FFF3E8] hover:text-[#C8742F] transition-colors whitespace-nowrap"
                                            onClick={() => addIepSectionItem("adlSkills")}
                                          >
                                            <span className="text-base leading-none">+</span>
                                            <span>Add Row</span>
                                          </button>
                                        </div>
                                      </th>
                            
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-white/30">
                                        <div className="flex items-center justify-between gap-3">
                                          <span>ACADEMIC</span>
                                          <button
                                            type="button"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white text-[#E38B52] text-xs font-semibold shadow-sm hover:bg-[#FFF3E8] hover:text-[#C8742F] transition-colors whitespace-nowrap"
                                            onClick={() => addIepSectionItem("academic")}
                                          >
                                            <span className="text-base leading-none">+</span>
                                            <span>Add Row</span>
                                          </button>
                                        </div>
                                      </th>
                            
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                                        <div className="flex items-center justify-between gap-3">
                                          <span>BEHAVIOURAL SKILLS</span>
                                          <button
                                            type="button"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white text-[#E38B52] text-xs font-semibold shadow-sm hover:bg-[#FFF3E8] hover:text-[#C8742F] transition-colors whitespace-nowrap"
                                            onClick={() => addIepSectionItem("behaviouralSkills")}
                                          >
                                            <span className="text-base leading-none">+</span>
                                            <span>Add Row</span>
                                          </button>
                                        </div>
                                      </th>
                                    </tr>
                                  </thead>
                            
                                  <tbody className="bg-white">
                                    {(() => {
                                      const adlItems = Array.isArray(iepData.sections?.adlSkills) ? iepData.sections.adlSkills : [];
                                      const academicItems = Array.isArray(iepData.sections?.academic) ? iepData.sections.academic : [];
                                      const behaviouralItems = Array.isArray(iepData.sections?.behaviouralSkills) ? iepData.sections.behaviouralSkills : [];
                                      const rowCount = Math.max(adlItems.length, academicItems.length, behaviouralItems.length);
                            
                                      if (rowCount === 0) {
                                        return (
                                          <tr>
                                            <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                                              No IEP skills added yet.
                                            </td>
                                          </tr>
                                        );
                                      }
                            
                                      return Array.from({ length: rowCount }).map((_, index) => (
                                        <tr key={`iep-edit-row-${index}`}>
                                          <td className="px-4 py-3 align-top text-sm text-gray-700 border-r border-gray-200">
                                            {adlItems[index] ? (
                                              <div className="flex items-start gap-2">
                                                <textarea
                                                  value={adlItems[index].text}
                                                  onChange={(e) => handleIepSectionChange("adlSkills", adlItems[index].id, e.target.value)}
                                                  placeholder="Enter ADL skill"
                                                  className="input-edit h-20 resize-none flex-1"
                                                  readOnly={!editingIepMonth || editingIepMonth !== monthYearKey}
                                                />
                                                <button
                                                  type="button"
                                                  className="text-red-500 mt-2 shrink-0"
                                                  onClick={() => removeIepSectionItem("adlSkills", adlItems[index].id)}
                                                  aria-label="Remove ADL skill"
                                                >
                                                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18" />
                                                    <path d="M8 6V4h8v2" />
                                                    <path d="M6 6l1 14h10l1-14" />
                                                  </svg>
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="h-20" />
                                            )}
                                          </td>
                            
                                          <td className="px-4 py-3 align-top text-sm text-gray-700 border-r border-gray-200">
                                            {academicItems[index] ? (
                                              <div className="flex items-start gap-2">
                                                <textarea
                                                  value={academicItems[index].text}
                                                  onChange={(e) => handleIepSectionChange("academic", academicItems[index].id, e.target.value)}
                                                  placeholder="Enter academic entry"
                                                  className="input-edit h-20 resize-none flex-1"
                                                  readOnly={!editingIepMonth || editingIepMonth !== monthYearKey}
                                                />
                                                <button
                                                  type="button"
                                                  className="text-red-500 mt-2 shrink-0"
                                                  onClick={() => removeIepSectionItem("academic", academicItems[index].id)}
                                                  aria-label="Remove academic entry"
                                                >
                                                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18" />
                                                    <path d="M8 6V4h8v2" />
                                                    <path d="M6 6l1 14h10l1-14" />
                                                  </svg>
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="h-20" />
                                            )}
                                          </td>
                            
                                          <td className="px-4 py-3 align-top text-sm text-gray-700">
                                            {behaviouralItems[index] ? (
                                              <div className="flex items-start gap-2">
                                                <textarea
                                                  value={behaviouralItems[index].text}
                                                  onChange={(e) => handleIepSectionChange("behaviouralSkills", behaviouralItems[index].id, e.target.value)}
                                                  placeholder="Enter behavioural skill"
                                                  className="input-edit h-20 resize-none flex-1"
                                                  readOnly={!editingIepMonth || editingIepMonth !== monthYearKey}
                                                />
                                                <button
                                                  type="button"
                                                  className="text-red-500 mt-2 shrink-0"
                                                  onClick={() => removeIepSectionItem("behaviouralSkills", behaviouralItems[index].id)}
                                                  aria-label="Remove behavioural skill"
                                                >
                                                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18" />
                                                    <path d="M8 6V4h8v2" />
                                                    <path d="M6 6l1 14h10l1-14" />
                                                  </svg>
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="h-20" />
                                            )}
                                          </td>
                                        </tr>
                                      ));
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="w-full table-fixed border-collapse">
                                  <colgroup>
                                    <col style={{ width: "34%" }} />
                                    <col style={{ width: "33%" }} />
                                    <col style={{ width: "33%" }} />
                                  </colgroup>
                                  <thead className="bg-gradient-to-r from-[#E38B52] to-[#F5A572]">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-white/30">ADL SKILLS</th>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-white/30">ACADEMIC</th>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">BEHAVIOURAL SKILLS</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white">
                                    {(() => {
                                      const adlItems = Array.isArray(iepData.sections?.adlSkills) ? iepData.sections.adlSkills : [];
                                      const academicItems = Array.isArray(iepData.sections?.academic) ? iepData.sections.academic : [];
                                      const behaviouralItems = Array.isArray(iepData.sections?.behaviouralSkills) ? iepData.sections.behaviouralSkills : [];
                                      const rowCount = Math.max(adlItems.length, academicItems.length, behaviouralItems.length);
                            
                                      if (rowCount === 0) {
                                        return (
                                          <tr>
                                            <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                                              No IEP skills added yet.
                                            </td>
                                          </tr>
                                        );
                                      }
                            
                                      return Array.from({ length: rowCount }).map((_, index) => (
                                        <tr key={`iep-view-row-${index}`}>
                                          <td className="px-4 py-3 align-top text-sm text-gray-700 border-r border-gray-200">
                                            {adlItems[index]?.text || ""}
                                          </td>
                                          <td className="px-4 py-3 align-top text-sm text-gray-700 border-r border-gray-200">
                                            {academicItems[index]?.text || ""}
                                          </td>
                                          <td className="px-4 py-3 align-top text-sm text-gray-700">
                                            {behaviouralItems[index]?.text || ""}
                                          </td>
                                        </tr>
                                      ));
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            )}
                
                            {/* Remarks */}
                            <div>
                              <label className="block text-sm font-semibold text-[#170F49] mb-2">IEP OF THE STUDENT:</label>
                              <textarea
                                value={iepData.iepStudent}
                                onChange={(e) => handleIepInputChange("iepStudent", e.target.value)}
                                placeholder="Enter the Individual Education Program details..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] resize-none"
                                rows={4}
                                readOnly={!editingIepMonth || editingIepMonth !== monthYearKey}
                              />
                            </div>
                
                            <div>
                              <label className="block text-sm font-semibold text-[#170F49] mb-2">Remarks:</label>
                              <textarea
                                value={iepData.remarks}
                                onChange={(e) => handleIepInputChange("remarks", e.target.value)}
                                placeholder="Enter additional remarks..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52] resize-none"
                                rows={4}
                                readOnly={!editingIepMonth || editingIepMonth !== monthYearKey}
                              />
                            </div>
                
                            {/* Signatures */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-[#6F6C90] mb-2">Principal</label>
                                <input
                                  type="text"
                                  value={iepData.signatures.principal}
                                  onChange={(e) => handleSignatureChange("principal", e.target.value)}
                                  placeholder="Principal's signature/name"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52]"
                                  readOnly={!editingIepMonth || editingIepMonth !== monthYearKey}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-[#6F6C90] mb-2">Teacher</label>
                                <input
                                  type="text"
                                  value={iepData.signatures.teacher}
                                  onChange={(e) => handleSignatureChange("teacher", e.target.value)}
                                  placeholder="Teacher's signature/name"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52]"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-[#6F6C90] mb-2">Parent/Guardian</label>
                                <input
                                  type="text"
                                  value={iepData.signatures.parent}
                                  onChange={(e) => handleSignatureChange("parent", e.target.value)}
                                  placeholder="Parent's signature/name"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E38B52]"
                                />
                              </div>
                            </div>
                
                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                              
                              
                            </div>
                          </div>
                        
                        )}
                      </div>
                      );
                    });
                  })()}
                </div>
              </div>
          ) : activeTab === "special-education" ? (
            <div className="max-w-6xl mx-auto p-6">
              <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-[#E38B52]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6"
                  />
                </svg>
                Special Education Report
              </h2>
              {/* Report Setup - Cylinder Container */}
              <div className="mb-6 p-6 border-2 border-[#E38B52]/30 rounded-2xl bg-gradient-to-br from-white via-orange-50/30 to-white shadow-xl">
                <h3 className="text-lg font-semibold text-[#170F49] mb-6 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#E38B52]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Assessment of : {" "}
                    <span>{student.name}</span>
                </h3>
              
                <div className="flex flex-col md:flex-row gap-6 items-end">
                  {/* Report Date */}
                  <div className="flex items-center gap-3">
                    <label className="block text-sm font-semibold text-[#170F49] whitespace-nowrap">
                      Report Date
                    </label>
                    
                    <div className="relative w-40 group">
                      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#E38B52]/40 to-[#F5A572]/40 blur-lg opacity-60 group-focus-within:opacity-100 transition-opacity duration-300" />
                      
                      <input
                        type="date"
                        value={reportDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="relative w-full px-3 py-1.5 rounded-xl border border-[#E38B52]/25 bg-white/90 text-[#170F49] font-medium shadow-sm transition-all duration-300 hover:border-[#E38B52]/45 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#E38B52]/20 focus:border-[#E38B52]"
                      />
                    </div>
                  </div>
              
                  {/* Create Table Button */}
                 <button
                    type="button"
                    onClick={handleAddManualTable}
                    disabled={!reportDate}
                    className={`px-6 py-2.5 bg-white text-[#E38B52] border border-[#E38B52] rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap ${
                      !reportDate ? "opacity-50 cursor-not-allowed hover:bg-white" : "hover:bg-[#FFF3E8]"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v12m6-6H6"
                      />
                    </svg>
                    Create Table
                  </button>
                </div>
              
                <p className="mt-3 text-xs text-[#6F6C90]">
                  Select a date and click Create Table to add a new assessment.
                </p>
              </div>
              
              {/* Results Section */}
              {savedTables.length > 0 ? (
                <div className="space-y-6">
                  {/* Display Tables (all past + current, collapsible) */}
                  {[...savedTables]
                    .sort((a, b) => {
                      const da = new Date(a.report_date || a.extracted_at || 0);
                      const db = new Date(b.report_date || b.extracted_at || 0);
                      return db - da; // newest first
                    })
                    .map((table, tableIndex) => (
                      <details
                        key={tableIndex}
                        data-special-edu-table="true"
                        open={!!showTableDetails[tableIndex]}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01]"
                      >
                        <summary
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          
                            // Block opening another table when a different table has unsaved edits
                            if (warnIfUnsavedOther(tableIndex, "opening this table")) return;
                          
                            if (table.isEditable) {
                              showToast("Save the table before closing it", "warning");
                              return;
                            }
                          
                            setShowTableDetails((prev) => ({
                              ...prev,
                              [tableIndex]: !prev[tableIndex],
                            }));
                          }}
                          className="bg-gradient-to-r from-[#E38B52] to-[#F5A572] px-6 py-4 flex items-center justify-between cursor-pointer list-none"
                        >
                        <div className="flex-1">
                            {/* Primary Info - Always Visible */}
                            <h3 className="text-lg font-bold text-white">
                              {table.table_year || (table.report_date ? new Date(table.report_date).getFullYear() : "Year")} Table
                            </h3>
                            <div className="text-sm text-white/90 mt-1.5 font-medium">
                              Report Date:{" "}
                              {table.report_date || "Not specified"}
                            </div>

                            {/* Details Toggle */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              
                                if (warnIfUnsavedOther(tableIndex, "opening this table")) return;
                              
                                if (table.isEditable) {
                                  showToast("Save the table before closing it", "warning");
                                  return;
                                }
                              
                                setShowTableDetails((prev) => ({
                                  ...prev,
                                  [tableIndex]: !prev[tableIndex],
                                }));
                              }}
                              className="mt-2 text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {showTableDetails[tableIndex]
                                ? "Hide Details"
                                : "Show Details"}
                            </button>

                            {/* Secondary Info - Collapsible */}
                            {showTableDetails[tableIndex] && (
                              <div className="mt-3 pt-3 border-t border-white/20 text-xs text-white/70 space-y-1">
                                <div>
                                  Last edited:{" "}
                                  {formatDate(table.last_edited_at) ||
                                    "Not edited yet"}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 ml-auto">
                            <div className="relative">
                              <span className="text-[15px] text-white/70 rounded-full px-2 py-1">
                                {table.assessment_phase || "1st assmt"}
                              </span>
                            </div>

                            {/* Export icon */}
                            <button
                              type="button"
                              aria-label="Export table as PDF"
                              title="Export PDF"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              
                                if (warnIfUnsavedOther(tableIndex, "exporting this table")) return;
                              
                                if (table.isEditable) {
                                  const phaseToSave = table.assessment_phase || "1st assmt";
                                  if (phaseToSave !== "1st assmt") {
                                    const dateVal = (table.quarterEditDates || {})[phaseToSave];
                                    if (!dateVal) {
                                      showToast("Please enter the date before saving this quarter", "warning");
                                      return;
                                    }
                                  }
                              
                                  handleSetTableEditable(table, false);
                                  setTableSavedStatus((prev) => ({ ...prev, [tableIndex]: true }));
                                  setTimeout(() => {
                                    setTableSavedStatus((prev) => ({ ...prev, [tableIndex]: false }));
                                  }, 1000);
                                }
                              
                                handleExportToPDF(table, tableIndex);
                              }}
                              className="w-11 h-11 rounded-full bg-white/95 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center text-[#E38B52]"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4v10m0 0l-4-4m4 4l4-4M5 20h14"
                                />
                              </svg>
                            </button>

                            {/* Delete icon */}
                            <button
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Prevent deleting other table while there is an unsaved one open
                                if (warnIfUnsavedOther(tableIndex, "deleting this table")) return;
                                setDeletePendingIndex(tableIndex);
                                setShowDeleteConfirm(true);
                              }}
                              title="Delete table"
                              className="w-11 h-11 rounded-full bg-white/95 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center text-red-500"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                              >
                                {/* lid */}
                                <path
                                  d="M9 5h6l1 2H8l1-2z"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {/* body */}
                                <rect
                                  x="8"
                                  y="7"
                                  width="8"
                                  height="11"
                                  rx="1.5"
                                  strokeWidth="1.8"
                                />
                                {/* inner lines */}
                                <line
                                  x1="11"
                                  y1="10"
                                  x2="11"
                                  y2="15"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                />
                                <line
                                  x1="13"
                                  y1="10"
                                  x2="13"
                                  y2="15"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </summary>

                        {(() => {
                          if (!table.rows || !table.rows.length) return null;

                          const headers =
                            table.headers && table.headers.length
                              ? table.headers
                              : Object.keys(table.rows[0] || {});

                          // Column that holds skill names (e.g. "Skill Area")
                          const skillColumn =
                            headers.find((h) =>
                              String(h).toLowerCase().includes("skill"),
                            ) || headers[0];

                          // Session/question columns: everything except skill + metadata
                          const sessionHeaders = headers.filter((h) => {
                            const raw = String(h || "").trim();
                            const lower = raw.toLowerCase();
                            const skillLower = String(skillColumn || "")
                              .trim()
                              .toLowerCase();

                            if (!raw) return false;
                            if (lower === skillLower) return false;
                            if (lower === "student name") return false;
                            if (lower === "register number") return false;
                            if (lower === "assessment date") return false;
                            return true;
                          });

                          if (!sessionHeaders.length) return null;

                          // Only show skills that actually exist in this table
                          const tableKey = tableIndex;
                          const activeKey =
                            activeSkillByTable[tableKey] || null;
                          const isQuestionsOpen =
                            !!questionsOpenByTable[tableKey];

                          const currentSkillMeta = activeKey
                            ? SPECIAL_EDU_SKILLS.find(
                                (s) => s.key === activeKey,
                              )
                            : null;

                          const questions = activeKey
                            ? SPECIAL_EDU_QUESTIONS[activeKey] || []
                            : [];

                          const skillRowIndex = activeKey
                            ? table.rows.findIndex(
                                (row) =>
                                  normalizeSectionKey(row[skillColumn]) ===
                                  activeKey,
                              )
                            : -1;

                          const skillRow =
                            skillRowIndex >= 0
                              ? table.rows[skillRowIndex]
                              : null;
                          const canEdit = !!table.isEditable;

                          const handleToggleCell = (colName, newValue) => {
                            if (!skillRow || !activeKey || !canEdit) return;
                          
                            const phase = table.assessment_phase || '1st assmt';
                            const isQuarterPhase =
                              phase === '1st Qtr' ||
                              phase === '2nd Qtr' ||
                              phase === '3rd Qtr' ||
                              phase === '4th Qtr';
                          
                            setSavedTables(prev => {
                              const nowIso = new Date().toISOString();
                          
                              const updated = prev.map(t => {
                                if (t !== table) return t;
                                const rows = t.rows || [];
                          
                                // For nonÃ¢â‚¬â€˜quarter phases (e.g. 1st assmt), edit the base value directly
                                if (!isQuarterPhase) {
                                  const newRows = rows.map((row, idx) =>
                                    idx === skillRowIndex ? { ...row, [colName]: newValue } : row
                                  );
                                  return { ...t, rows: newRows, last_edited_at: nowIso };
                                }
                          
                                // For quarter phases (1stÃ¢â‚¬â€œ4th Qtr): only original B can be changed
                                const row = rows[skillRowIndex] || {};
                                const rawCurrent = row[colName];
                                const baseVal =
                                  typeof rawCurrent === 'string'
                                    ? rawCurrent.trim().toUpperCase()
                                    : '';
                          
                                if (baseVal !== 'B') return t; // ignore nonÃ¢â‚¬â€˜B cells in quarter phases
                          
                                const cellKey = `${skillRowIndex}:${colName}`;
                                const existingSnapshots = t.quarterSnapshots || {};
                                const phaseSnapshot = existingSnapshots[phase] || {};
                          
                                let newPhaseSnapshot = phaseSnapshot;
                                if (newValue === 'A' || newValue === 'B') {
                                  newPhaseSnapshot = { ...phaseSnapshot, [cellKey]: newValue };
                                } else {
                                  return t;
                                }
                          
                                return {
                                  ...t,
                                  quarterSnapshots: { ...existingSnapshots, [phase]: newPhaseSnapshot },
                                  last_edited_at: nowIso,
                                };
                              });
                          
                              try {
                                if (typeof window !== 'undefined' && id) {
                                  window.localStorage.setItem(
                                    `special-education-tables:${id}`,
                                    JSON.stringify(updated)
                                  );
                                }
                              } catch (err) {
                                console.warn('Failed to persist updated Special Education tables', err);
                              }
                          
                              return updated;
                            });
                          };

                          return (
                            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-semibold text-gray-700">
                                  Questionnaire (A = Yes, B = No)
                                </h4>
                                <div className="flex items-center gap-2">
                                  {/* Edit/Save/Saved Toggle Ã¢â‚¬â€œ now always visible */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                              
                                      if (table.isEditable) {
                                        const phaseToSave = table.assessment_phase || "1st assmt";
                                      
                                        if (phaseToSave !== "1st assmt") {
                                          const dateVal = (table.quarterEditDates || {})[phaseToSave];
                                          if (!dateVal) {
                                            showToast("Please enter the date before saving this quarter", "warning");
                                            return;
                                          }
                                        }
                                      
                                        handleSetTableEditable(table, false);
                                        setTableSavedStatus((prev) => ({
                                          ...prev,
                                          [tableIndex]: true,
                                        }));
                                        setTimeout(() => {
                                          setTableSavedStatus((prev) => ({
                                            ...prev,
                                            [tableIndex]: false,
                                          }));
                                        }, 1000);
                                      } else {
                                        handleSetTableEditable(table, true);
                                      }
                                    }}
                                    className={
                                      "px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all duration-200 shadow-sm " +
                                      (tableSavedStatus[tableIndex]
                                        ? "bg-green-50 text-green-700 border-green-300"
                                        : table.isEditable
                                          ? "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                                          : "bg-[#E38B52] text-white border-[#E38B52] hover:bg-[#C8742F] hover:shadow-md") +
                                      (pulsatingEditButton[tableKey] ? " pulsate-edit" : "")
                                    }
                                  >
                                    {tableSavedStatus[tableIndex] ? (
                                      <span className="flex items-center gap-1">
                                        Saved
                                        {/* ...check icon svg... */}
                                      </span>
                                    ) : table.isEditable ? (
                                      "Save"
                                    ) : (
                                      "Edit"
                                    )}
                                  </button>
                              
                                  {table.isEditable && (
                                    <div className="flex flex-col gap-2">
                                      <select
                                        value={table.assessment_phase || "1st assmt"}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        
                                        onChange={(e) => {
                                          const phase = e.target.value;
                                          const tableKey = savedTables.indexOf(table);
                                  
                                          if (!isPhaseUnlocked(table, phase)) {
                                            showToast(
                                              `Complete ${SPECIAL_EDU_ASSESSMENT_PHASES[SPECIAL_EDU_ASSESSMENT_PHASES.indexOf(phase) - 1]} before accessing this quarter`,
                                              "warning",
                                            );
                                            return;
                                          }
                                  
                                          e.stopPropagation();
                                          const nowIso = new Date().toISOString();
                                          setSavedTables((prev) => {
                                            const updated = prev.map((t) =>
                                              t === table ? { ...t, assessment_phase: phase, last_edited_at: nowIso } : t,
                                            );
                                            try {
                                              if (typeof window !== "undefined" && id) {
                                                const key = `special-education-tables:${id}`;
                                                window.localStorage.setItem(key, JSON.stringify(updated));
                                              }
                                            } catch (err) {
                                              console.warn("Failed to persist assessment phase", err);
                                            }
                                            return updated;
                                          });
                                        }}
                                        className="text-[10px] bg-white text-[#170F49] border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#E38B52] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {SPECIAL_EDU_ASSESSMENT_PHASES.map((phase) => {
                                          const isUnlocked = isPhaseUnlocked(table, phase);
                                          return (
                                            <option key={phase} value={phase} disabled={!isUnlocked}>
                                              {phase} {!isUnlocked ? "(Locked)" : ""}
                                            </option>
                                          );
                                        })}
                                      </select>
                                  
                                      {table.assessment_phase !== "1st assmt" && (
                                        <input
                                          type="date"
                                          value={(table.quarterEditDates || {})[table.assessment_phase] || ""}
                                          max={new Date().toISOString().slice(0, 10)}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) =>
                                            handleQuarterEditDateChange(table, table.assessment_phase, e.target.value)
                                          }
                                          className="text-[10px] bg-white text-[#170F49] border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#E38B52] shadow-sm"
                                        />
                                      )}
                                    </div>
                                  )}
                              
                                  {/* Show/Hide questions only makes sense when a skill is selected */}
                                  {activeKey && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (warnIfUnsavedOther(tableKey, "opening questions in this table")) return;
                                        setQuestionsOpenByTable((prev) => ({ ...prev, [tableKey]: !prev[tableKey] }));
                                      }}
                                      className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
                                    >
                                      {questionsOpenByTable[tableKey] ? "Hide questions" : "Show questions"}
                                    </button>
                                  )}
                                </div>
                              </div>
                              {!canEdit && (
                                <p className="text-[11px] text-gray-500 mb-1">
                                  This table is read-only. Click "Edit" in the
                                  header to modify.
                                </p>
                              )}

                              {/* Questions for the currently selected skill only */}
                              <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                {!activeKey ? (
                                  <div className="text-[11px] text-gray-500">
                                    Click a skill in the Skill Area column to
                                    view its questions.
                                  </div>
                                ) : !skillRow ? (
                                  <div className="text-[11px] text-gray-500">
                                    No data for this skill in this table.
                                  </div>
                                ) : !isQuestionsOpen ? (
                                  <div className="text-[11px] text-gray-500">
                                    Questions are hidden. Click "Show questions"
                                    to view them.
                                  </div>
                                ) : (
                                  <div
                                    className="space-y-1 max-h-64 overflow-y-auto overflow-x-hidden pr-1"
                                    id={`questions-container-${tableKey}`}
                                  >
                                    {questions
                                      .slice(0, sessionHeaders.length)
                                      .map((questionText, idx) => {
                                        const colName = sessionHeaders[idx];
                                        const phase =
                                          table.assessment_phase || "1st assmt";
                                        const quarterOverrides =
                                          table.quarterOverrides || {};
                                        const cellKey = `${skillRowIndex}:${colName}`;

                                        const rawValue = skillRow[colName];
                                        const baseVal =
                                          typeof rawValue === 'string'
                                            ? rawValue.trim().toUpperCase()
                                            : '';
                                        
                                        const snapshots = table.quarterSnapshots || {};
                                        const effectiveVal = getEffectiveValueForPhase(
                                          baseVal,
                                          cellKey,
                                          phase,
                                          snapshots
                                        );
                                        
                                        const isYes = effectiveVal === 'A';
                                        const isNo = effectiveVal === 'B';
                                        const isActiveQuestion =
                                          activeQuestionByTable[tableKey] ===
                                          idx;

                                        return (
                                          <div
                                            key={idx}
                                            ref={(el) => {
                                              if (
                                                !questionRefs.current[tableKey]
                                              ) {
                                                questionRefs.current[tableKey] =
                                                  {};
                                              }
                                              questionRefs.current[tableKey][
                                                idx
                                              ] = el;
                                            }}
                                            className={
                                              "flex flex-wrap items-center gap-2 text-[11px] rounded-lg px-2 py-1.5 border transition-all duration-200 " +
                                              (isActiveQuestion
                                                ? "bg-[#E38B52]/20 border-[#E38B52] shadow-md"
                                                : "bg-gray-50 border-gray-100")
                                            }
                                          >
                                            <span className="flex-1 min-w-0 break-words">
                                              <span className="font-semibold mr-1">
                                                {idx + 1}.
                                              </span>
                                              {questionText}
                                            </span>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                              <span
                                                role="button"
                                                onClick={() => {
                                                  if (canEdit) {
                                                    handleToggleCell(
                                                      colName,
                                                      "A",
                                                    );
                                                  } else {
                                                    // Trigger pulsate animation on edit button
                                                    setPulsatingEditButton(
                                                      (prev) => ({
                                                        ...prev,
                                                        [tableKey]: true,
                                                      }),
                                                    );
                                                    setTimeout(() => {
                                                      setPulsatingEditButton(
                                                        (prev) => ({
                                                          ...prev,
                                                          [tableKey]: false,
                                                        }),
                                                      );
                                                    }, 3000);
                                                  }
                                                }}
                                                className={
                                                  "px-2 py-[1px] rounded-full border text-[10px] " +
                                                  (canEdit
                                                    ? "cursor-pointer "
                                                    : "cursor-not-allowed opacity-60 ") +
                                                  (isYes
                                                    ? "bg-green-100 text-green-700 border-green-300"
                                                    : "text-gray-500 border-gray-200 hover:bg-green-50")
                                                }
                                              >
                                                Yes
                                              </span>

                                              <span
                                                role="button"
                                                onClick={() => {
                                                  if (canEdit) {
                                                    handleToggleCell(
                                                      colName,
                                                      "B",
                                                    );
                                                  } else {
                                                    // Trigger pulsate animation on edit button
                                                    setPulsatingEditButton(
                                                      (prev) => ({
                                                        ...prev,
                                                        [tableKey]: true,
                                                      }),
                                                    );
                                                    setTimeout(() => {
                                                      setPulsatingEditButton(
                                                        (prev) => ({
                                                          ...prev,
                                                          [tableKey]: false,
                                                        }),
                                                      );
                                                    }, 3000);
                                                  }
                                                }}
                                                className={
                                                  "px-2 py-[1px] rounded-full border text-[10px] " +
                                                  (canEdit
                                                    ? "cursor-pointer "
                                                    : "cursor-not-allowed opacity-60 ") +
                                                  (isNo
                                                    ? "bg-red-100 text-red-700 border-red-300"
                                                    : "text-gray-500 border-gray-200 hover:bg-red-50")
                                                }
                                              >
                                                No
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Original table view with grouped totals/quarters */}
                        <div className="overflow-x-auto">
                          {(() => {
                            const rawHeaders =
                              table.headers && table.headers.length
                                ? table.headers
                                : table.rows && table.rows.length
                                  ? Object.keys(table.rows[0] || {})
                                  : [];
                            // Drop non-data columns
                            const allHeaders = rawHeaders.filter(
                              (h) =>
                                h !== "Student Name" &&
                                h !== "Register Number" &&
                                h !== "Assessment Date",
                            );

                            const normalize = (h) =>
                              String(h || "")
                                .toLowerCase()
                                .replace(/\s+/g, "")
                                .replace(/[^a-z0-9]/g, "");

                            // Detect summary columns by name
                            const totalAKey = allHeaders.find(
                              (h) => normalize(h) === "totala",
                            );
                            const totalBKey = allHeaders.find(
                              (h) => normalize(h) === "totalb",
                            );

                            const quarterDefs = [
                              { pattern: "iqr", label: "I Qr" },
                              { pattern: "iiqr", label: "II Qr" },
                              { pattern: "iiiqr", label: "III Qr" },
                              { pattern: "ivqr", label: "IV Qr" },
                            ];
                            const quarterKeys = quarterDefs.map((def) => ({
                              def,
                              key:
                                allHeaders.find(
                                  (h) => normalize(h) === def.pattern,
                                ) || null,
                            }));

                            // Base (skill + 1..20 etc.), excluding summary cols
                            const summarySet = new Set(
                              [
                                totalAKey,
                                totalBKey,
                                ...quarterKeys.map((q) => q.key),
                              ].filter(Boolean),
                            );
                            const baseHeaders = allHeaders.filter(
                              (h) => !summarySet.has(h),
                            );

                            // Identify the skill column in this table
                            const skillColumn =
                              allHeaders.find((h) =>
                                String(h || "")
                                  .toLowerCase()
                                  .includes("skill"),
                              ) || allHeaders[0];

                          const sessionHeaders = baseHeaders.filter(h => h !== skillColumn);
                      
                          // Table key and currently active skill for this table
                          const tableKey = tableIndex;
                          const activeKey = activeSkillByTable[tableKey] || null;
                      
                          // Build leaf columns (second header row + body)
                          const leafColumns = [];
                          
                          
                        
                          
                          
                      
                          // Base columns: one cell, spanning both header rows
                          baseHeaders.forEach(h => {
                            const isSkillCol = h === skillColumn;
                            leafColumns.push({
                              group: null,
                              header: String(h).replace(/^Session\s+/i, ''),
                              subLabel: null,
                              isSkill: isSkillCol,
                              fieldName: h,
                              getValue: row => row[h],
                            });
                          });
                      
                          // 1st Assessment group: TOTAL A / TOTAL B
                          if (totalAKey || totalBKey) {
                            if (totalAKey) {
                              leafColumns.push({
                                group: '1st Assmt',
                                header: 'A',
                                subLabel: 'A',
                                getValue: row => row[totalAKey],
                              });
                            }
                            if (totalBKey) {
                              leafColumns.push({
                                group: '1st Assmt',
                                header: 'B',
                                subLabel: 'B',
                                getValue: row => row[totalBKey],
                              });
                            }
                          }
                      
                          // Quarter groups: for now, show existing value under A, leave B empty
                          quarterKeys.forEach(({ def, key }) => {
                            if (!key) return;
                            leafColumns.push({
                              group: def.label,
                              header: 'A',
                              subLabel: 'A',
                              getValue: row => row[key],
                            });
                            leafColumns.push({
                              group: def.label,
                              header: 'B',
                              subLabel: 'B',
                              getValue: () => '',
                            });
                          });
                      
                          if (!leafColumns.length) return null;
                      
                          return (
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                {/* Top header row: base cols (rowSpan=2) + grouped headings */}
                                <tr>
                                  {(() => {
                                    const cells = [];
                                    let i = 0;
                                    while (i < leafColumns.length) {
                                      const col = leafColumns[i];
                                      if (!col.group) {
                                        // Simple column spanning both header rows
                                        cells.push(
                                          <th
                                            key={`h1-${i}`}
                                            rowSpan={2}
                                            className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider"
                                          >
                                            {col.header}
                                          </th>
                                        );
                                        i += 1;
                                        continue;
                                      }
                                      // Grouped columns (1st Assessment, I Qr, Ã¢â‚¬Â¦)
                                      const group = col.group;
                                      let span = 0;
                                      while (
                                        i + span < leafColumns.length &&
                                        leafColumns[i + span].group === group
                                      ) {
                                        span += 1;
                                      }
                                      cells.push(
                                        <th
                                          key={`group-${group}-${i}`}
                                          colSpan={span}
                                          className="px-2 py-1.5 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider"
                                        >
                                          {group}
                                        </th>
                                      );
                                      i += span;
                                    }
                                    return cells;
                                  })()}
                                </tr>
                                {/* Second header row: A/B under each grouped heading */}
                                <tr>
                                  {leafColumns.map((col, idx) =>
                                    col.group ? (
                                      <th
                                        key={`h2-${idx}`}
                                        className="px-2 py-1.5 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider"
                                      >
                                        {col.subLabel || col.header}
                                      </th>
                                    ) : null
                                  )}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {table.rows?.map((row, rowIdx) => {
                                  const rawSkillVal = row[skillColumn];
                                  const normalizedSkill = normalizeSectionKey(rawSkillVal);
                                  const rowSkillKey = normalizedSkill || null;
                                  const isRowSelected = rowSkillKey && activeKey === rowSkillKey;
                                  const phase = table.assessment_phase || '1st assmt';
                                  const snapshots = table.quarterSnapshots || {};
                              
                                  
                                  // Function to calculate A/B counts for any specific phase
                                  const getCountsForPhase = (targetPhase) => {
                                    return getPhaseCounts(row, rowIdx, targetPhase, sessionHeaders, snapshots);
                                  };
                              
                                  return (
                                    <tr
                                      key={rowIdx}
                                      className={
                                        'hover:bg-gray-50 ' +
                                        (isRowSelected ? 'bg-[#FFEBD7]' : '')
                                      }
                                    >
                                      {leafColumns.map((col, cellIdx) => {
                                        // Determine if this cell is one of the summary A/B cells
                                        const isSummaryCell = !!col.group;
                                        let cellValue;
                              
                                        if (isSummaryCell) {
                                          const label = (col.subLabel || col.header || '').toUpperCase();
                                          
                                          // Determine which phase this column represents
                                          let columnPhase = '1st assmt';
                                          if (col.group === 'I Qr') columnPhase = '1st Qtr';
                                          else if (col.group === 'II Qr') columnPhase = '2nd Qtr';
                                          else if (col.group === 'III Qr') columnPhase = '3rd Qtr';
                                          else if (col.group === 'IV Qr') columnPhase = '4th Qtr';
                                          
                                          let showCounts = true;
                                          if (columnPhase !== '1st assmt') {
                                            const phaseSaved =
                                              table.savedPhases?.[columnPhase] ||
                                              phaseSavedStatus[tableIndex]?.[columnPhase];
                                          
                                            if (!phaseSaved) {
                                              showCounts = false;
                                            }
                                          }

                                          if (showCounts) {
                                            const { aCount: colACount, bCount: colBCount } =
                                              getCountsForPhase(columnPhase);

                                            if (label === 'A') {
                                              cellValue = colACount || '0';
                                            } else if (label === 'B') {
                                              cellValue = colBCount || '0';
                                            } else {
                                              cellValue = '-';
                                            }
                                          } else {
                                            // quadrant not edited yet Ã¢â€ â€™ show "-"
                                            cellValue = '-';
                                          }
                                        } else {
                                          const raw = col.getValue(row);
                                          cellValue =
                                            raw === undefined || raw === null || raw === '' ? '-' : raw;
                                        }
                              
                                        const fieldName = col.fieldName;
                                        const isSessionBaseCell =
                                          !col.group && !col.isSkill && fieldName && sessionHeaders.includes(fieldName);
                                        
                                        let hasQuadrantChange = false;
                                        let overrideQuarter = null;
                                        if (isSessionBaseCell) {
                                          const raw = row[fieldName];
                                          const baseVal =
                                            typeof raw === 'string' ? raw.trim().toUpperCase() : '';
                                          const cellKey = `${rowIdx}:${fieldName}`;
                                          const effectiveVal = getEffectiveValueForPhase(
                                            baseVal,
                                            cellKey,
                                            phase,
                                            snapshots
                                          );
                                          hasQuadrantChange = baseVal === 'B' && effectiveVal === 'A';
                                          
                                          // Find which quarter made the change (for correct strike pattern)
                                          if (hasQuadrantChange) {
                                            const phaseOrder = ['1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr'];
                                            const idx = phaseOrder.indexOf(phase);
                                            if (idx >= 0) {
                                              for (let i = 0; i <= idx; i++) {
                                                const p = phaseOrder[i];
                                                const map = snapshots[p];
                                                if (map && map[cellKey] === 'A') {
                                                  overrideQuarter = p;
                                                  break;
                                                }
                                              }
                                            }
                                          }
                                        }
                                        
                                        // For color: just use the actual letter we see (A = blue, B = red)
                                        const isAVisual = !isSummaryCell && cellValue === 'A';
                                        const isBVisual = !isSummaryCell && cellValue === 'B';
                                        
                                        let textClass;
                                        if (isSummaryCell) textClass = 'text-gray-900 ';
                                        else if (isAVisual) textClass = 'text-blue-600 ';
                                        else if (isBVisual) textClass = 'text-red-600 '; // B stays red even when overridden
                                        else textClass = 'text-gray-900 ';

                                          let cellInner = cellValue;
                                          // Show B with strikethrough pattern based on WHICH quarter the override was made in
                                          if (
                                            isSessionBaseCell &&
                                            cellValue === "B" &&
                                            hasQuadrantChange &&
                                            !isSummaryCell
                                          ) {
                                            if (overrideQuarter === "1st Qtr") {
                                              // 1st Qtr override: horizontal lines
                                              cellInner = (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                  <span className="relative z-10 font-semibold">
                                                    {cellValue}
                                                  </span>
                                                  <span className="pointer-events-none absolute left-0 right-0 h-[1px] bg-blue-600 top-[30%]" />
                                                  <span className="pointer-events-none absolute left-0 right-0 h-[1px] bg-blue-600 top-1/2 -translate-y-1/2" />
                                                  <span className="pointer-events-none absolute left-0 right-0 h-[1px] bg-blue-600 top-[70%]" />
                                                </span>
                                              );
                                            } else if (
                                              overrideQuarter === "2nd Qtr"
                                            ) {
                                              // 2nd Qtr override: vertical lines
                                              cellInner = (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                  <span className="relative z-10 font-semibold">
                                                    {cellValue}
                                                  </span>
                                                  <span className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-blue-600 left-[30%]" />
                                                  <span className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-blue-600 left-1/2 -translate-x-1/2" />
                                                  <span className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-blue-600 left-[70%]" />
                                                </span>
                                              );
                                            } else if (
                                              overrideQuarter === "3rd Qtr"
                                            ) {
                                              // 3rd Qtr override: grid (horizontal + vertical)
                                              cellInner = (
                                                <span className="absolute inset-0 flex items-center justify-center">
                                                  <span className="relative z-10 font-semibold">
                                                    {cellValue}
                                                  </span>
                                                  <span className="pointer-events-none absolute left-0 right-0 h-[1px] bg-blue-600 top-[30%]" />
                                                  <span className="pointer-events-none absolute left-0 right-0 h-[1px] bg-blue-600 top-1/2 -translate-y-1/2" />
                                                  <span className="pointer-events-none absolute left-0 right-0 h-[1px] bg-blue-600 top-[70%]" />
                                                  <span className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-blue-600 left-[30%]" />
                                                  <span className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-blue-600 left-1/2 -translate-x-1/2" />
                                                  <span className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-blue-600 left-[70%]" />
                                                </span>
                                              );
                                            } else if (
                                              overrideQuarter === "4th Qtr"
                                            ) {
                                              // 4th Qtr override: diagonal lines
                                              cellInner = (
                                                <span className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                                  <span className="relative z-10 font-semibold">
                                                    {cellValue}
                                                  </span>
                                                  <span className="pointer-events-none absolute inset-0">
                                                    <span
                                                      className="absolute w-[141%] h-[1px] bg-blue-600 left-1/2 top-[30%] -translate-x-1/2"
                                                      style={{
                                                        transform:
                                                          "translateX(-50%) rotate(45deg)",
                                                        transformOrigin:
                                                          "center",
                                                      }}
                                                    />
                                                    <span
                                                      className="absolute w-[141%] h-[1px] bg-blue-600 left-1/2 top-[70%] -translate-x-1/2"
                                                      style={{
                                                        transform:
                                                          "translateX(-50%) rotate(45deg)",
                                                        transformOrigin:
                                                          "center",
                                                      }}
                                                    />
                                                  </span>
                                                </span>
                                              );
                                            }
                                          }

                                          let onClick;
                                          let extraClass = "";

                                          // Clicking the skill column selects the skill and opens questions
                                          if (col.isSkill && rowSkillKey) {
                                            onClick = () => {
                                              if (isAnotherTableUnsaved(table)) {
                                                showToast("Save the current table before switching skills", "warning");
                                                return;
                                              }
                                              setActiveSkillByTable((prev) => {
                                                const isSame =
                                                  prev[tableKey] ===
                                                  rowSkillKey;
                                                const nextKey = isSame
                                                  ? undefined
                                                  : rowSkillKey;

                                                setQuestionsOpenByTable(
                                                  (prevOpen) => ({
                                                    ...prevOpen,
                                                    [tableKey]: !!nextKey,
                                                  }),
                                                );

                                                // Clear active question when toggling skill
                                                if (!nextKey) {
                                                  setActiveQuestionByTable(
                                                    (prevQ) => ({
                                                      ...prevQ,
                                                      [tableKey]: undefined,
                                                    }),
                                                  );
                                                }

                                                return {
                                                  ...prev,
                                                  [tableKey]: nextKey,
                                                };
                                              });
                                            };
                                            extraClass =
                                              " cursor-pointer " +
                                              (isRowSelected
                                                ? "font-semibold text-gray-900 border-l-4 border-[#E38B52]"
                                                : "hover:bg-orange-50");
                                          }

                                          // Clicking a session cell (1, 2, 3, etc.) navigates to that question
                                          if (
                                            isSessionBaseCell &&
                                            rowSkillKey
                                          ) {
                                            const questionIdx =
                                              sessionHeaders.indexOf(fieldName);
                                              onClick = () => {
                                              if (isAnotherTableUnsaved(table)) {
                                                showToast("Save the current table before switching skills", "warning");
                                                return;
                                              }
                                              
                                              // First, ensure the skill is selected and questions are open
                                              setActiveSkillByTable((prev) => ({
                                                ...prev,
                                                [tableKey]: rowSkillKey,
                                              }));

                                              setQuestionsOpenByTable(
                                                (prev) => ({
                                                  ...prev,
                                                  [tableKey]: true,
                                                }),
                                              );

                                              // Set the active question
                                              setActiveQuestionByTable(
                                                (prev) => ({
                                                  ...prev,
                                                  [tableKey]: questionIdx,
                                                }),
                                              );

                                              // Scroll to the question after a brief delay to ensure rendering
                                              setTimeout(() => {
                                                const questionEl =
                                                  questionRefs.current[
                                                    tableKey
                                                  ]?.[questionIdx];
                                                if (questionEl) {
                                                  questionEl.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "center",
                                                  });
                                                }
                                              }, 200);
                                            };

                                            extraClass =
                                              " cursor-pointer hover:bg-[#E38B52]/10 hover:scale-110 transition-all duration-150";
                                          }

                                          return (
                                            <td
                                              key={cellIdx}
                                              onClick={onClick}
                                              className={
                                                `relative px-2 py-1 whitespace-nowrap text-xs font-semibold ` +
                                                (col.group
                                                  ? "text-center "
                                                  : "text-left ") +
                                                textClass +
                                                extraClass
                                              }
                                            >
                                              {cellInner}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            );
                          })()}
                        </div>
                      </details>
                    ))}
                </div>                 
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-[#E38B52]/30 bg-white/70 p-6 text-center text-sm text-[#6F6C90]">
                    No table created yet.
                  </div>
                )}               
              
            </div>          
          ) : (
            <div className="max-w-6xl mx-auto p-6">
              <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-[#E38B52]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6"
                  />
                </svg>
                Case Record
              </h2>
              <div className="flex gap-6 items-start">
              {/* Left Sidebar Navigation */}
              <aside className="w-64 flex-shrink-0 sticky top-5 self-start">
                <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 w-64 z-30 max-h-[calc(100vh-40px)] overflow-y-auto">
                  <div className="mb-6 pb-3 border-b border-[#E38B52]/20">
                    <h3 className="text-lg font-bold text-[#170F49] mb-3">
                      Case Record Sections
                    </h3>
                    <div className="flex gap-2">
                      <div className="relative group flex-1">
                        <button
                          onClick={handleEditStart}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-[#E38B52] rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 transform border border-[#E38B52]/20"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-[#E38B52] text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg z-50 border border-[#E38B52]/20">
                          Edit
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      </div>
                      <div className="relative group flex-1">
                        <button
                          onClick={handleDownloadCaseRecord}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-[#E38B52] to-[#F5A572] text-white rounded-xl hover:from-[#C8742F] hover:to-[#E38B52] transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 transform"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-[#E38B52] text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg z-50 border border-[#E38B52]/20">
                          Download
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <nav className="space-y-2">
                    {[
                      {
                        id: "identification",
                        label: "Identification Data",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "demographic",
                        label: "Demographic Data",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "contact",
                        label: "Contact & Medical",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "family",
                        label: "Family History",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "development",
                        label: "Development History",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "education",
                        label: "Special Education",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "medical",
                        label: "Medical Information",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "documents",
                        label: "Documents",
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        ),
                      },
                    ].map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveCaseSection(section.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                          activeCaseSection === section.id
                            ? "bg-[#E38B52] text-white shadow-lg"
                            : "bg-white/50 text-[#170F49] hover:bg-white/80"
                        }`}
                      >
                        <span
                          className={`transition-all duration-300 ${
                            activeCaseSection === section.id
                              ? "text-white"
                              : "text-[#E38B52]"
                          }`}
                        >
                          {section.icon}
                        </span>
                        <span className="text-sm font-medium">
                          {section.label}
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Right Content Area */}
              <div className="flex-1 min-w-0">
                {/* Case Record Completion Progress Bar - always visible */}
                <div className="mb-8 bg-white/50 rounded-2xl p-6 shadow-lg border border-white/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-[#170F49]">
                      Case Record Completion
                    </h3>
                    <span className="text-xl font-bold text-[#E38B52]">
                      {caseRecordCompletion}%
                    </span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-3 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-[#F58540] to-[#E38B52] h-3 rounded-full shadow-md transition-all duration-700 ease-out"
                      style={{ width: `${caseRecordCompletion}%` }}
                    ></div>
                  </div>
                </div>

                {/* Identification Data Section */}
                {activeCaseSection === "identification" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                        />
                      </svg>
                      Identification Data
                    </h2>
                    <div className="p-6 bg-white/50 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">Name</p>
                          {editMode ? (
                            <input
                              type="text"
                              name="name"
                              value={editData?.name || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.name || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">Admission No</p>
                          {editMode ? (
                            <input
                              type="text"
                              name="admissionNumber"
                              value={editData?.admissionNumber || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.admissionNumber || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">
                            Date of Birth
                          </p>
                          {editMode ? (
                            <input
                              type="date"
                              name="dob"
                              value={editData?.dob || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.dob || "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-[#6F6C90]">Age</p>
                          {editMode ? (
                            <input
                              type="number"
                              name="age"
                              value={editData?.age || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.age || "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-[#6F6C90]">Sex</p>
                          {editMode ? (
                            <select
                              name="gender"
                              value={editData?.gender || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.gender || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">Education</p>
                          {editMode ? (
                            <input
                              type="text"
                              name="class"
                              value={editData?.class || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.class || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">Blood Group</p>
                          {editMode ? (
                            <select
                              name="bloodGroup"
                              value={editData?.bloodGroup || ""}
                              onChange={handleEditSelectChange("bloodGroup")}
                              className="input-edit"
                            >
                              <option value="">Select</option>
                              {BLOOD_GROUP_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.bloodGroup || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">Religion</p>
                          {editMode ? (
                            <select
                              name="religion"
                              value={editData?.religion || ""}
                              onChange={handleEditSelectChange("religion")}
                              className="input-edit"
                            >
                              <option value="">Select</option>
                              {RELIGION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.religion || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-[#6F6C90]">
                            Category (SC/ST/OBC/OEC)
                          </p>
                          {editMode ? (
                            <input
                              type="text"
                              name="category"
                              value={editData?.category || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.category || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-4">
                          <p className="text-sm text-[#6F6C90]">
                            Aadhar Number
                          </p>
                          {editMode ? (
                            <input
                              type="text"
                              name="aadharNumber"
                              value={editData?.aadharNumber || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.aadharNumber || "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Demographic Data Section */}
                {activeCaseSection === "demographic" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      Demographic Data
                    </h2>
                    <div className="space-y-6">
                      {/* Family Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Father's Card */}
                        <div className="bg-white/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
                          <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                            Father's Information
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-[#6F6C90]">Name</p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="fatherName"
                                  value={editData?.fatherName || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.fatherName || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[#6F6C90]">
                                Education
                              </p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="fatherEducation"
                                  value={editData?.fatherEducation || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.fatherEducation || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[#6F6C90]">
                                Occupation
                              </p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="fatherOccupation"
                                  value={editData?.fatherOccupation || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.fatherOccupation || "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mother's Card */}
                        <div className="bg-white/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
                          <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                            Mother's Information
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-[#6F6C90]">Name</p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="motherName"
                                  value={editData?.motherName || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.motherName || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[#6F6C90]">
                                Education
                              </p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="motherEducation"
                                  value={editData?.motherEducation || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.motherEducation || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[#6F6C90]">
                                Occupation
                              </p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="motherOccupation"
                                  value={editData?.motherOccupation || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.motherOccupation || "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Guardian's Card */}
                        <div className="bg-white/50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300">
                          <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                            Guardian's Information
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-[#6F6C90]">Name</p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="guardianName"
                                  value={editData?.guardianName || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.guardianName || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[#6F6C90]">
                                Relationship
                              </p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="guardianRelationship"
                                  value={editData?.guardianRelationship || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.guardianRelationship || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-[#6F6C90]">
                                Occupation
                              </p>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="guardianOccupation"
                                  value={editData?.guardianOccupation || ""}
                                  onChange={handleEditChange}
                                  className="input-edit"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.guardianOccupation || "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Info Section */}
                      <div className="bg-white/50 rounded-2xl p-6 mt-6 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Total Family Income per Month
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="totalFamilyIncome"
                                value={editData?.totalFamilyIncome || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.totalFamilyIncome || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Address & Phone Number
                            </p>
                            <p className="text-[#170F49] font-medium">
                              {student?.address_and_phone ||
                                `${student?.address}, ${student?.phoneNumber}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact & Medical Information */}
                {activeCaseSection === "contact" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Contact & Medical Information
                    </h2>
                    <div className="p-8 bg-white/50 rounded-2xl mb-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/60">
                        <div>
                          <p className="text-sm text-[#6F6C90]">
                            Informant's Name
                          </p>
                          {editMode ? (
                            <input
                              type="text"
                              name="informantName"
                              value={editData?.informantName || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-lg text-[#170F49] font-medium">
                              {student?.informantName || "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-[#6F6C90]">Relationship</p>
                          {editMode ? (
                            <input
                              type="text"
                              name="informantRelationship"
                              value={editData?.informantRelationship || ""}
                              onChange={handleEditChange}
                              className="input-edit"
                            />
                          ) : (
                            <p className="text-lg text-[#170F49] font-medium">
                              {student?.informantRelationship || "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="pb-6 border-b border-white/60">
                        <p className="text-sm text-[#6F6C90]">
                          Duration of Contact
                        </p>
                        {editMode ? (
                          <input
                            type="text"
                            name="durationOfContact"
                            value={editData?.durationOfContact || ""}
                            onChange={handleEditChange}
                            className="input-edit"
                          />
                        ) : (
                          <p className="text-lg text-[#170F49] font-medium">
                            {student?.durationOfContact || "N/A"}
                          </p>
                        )}
                      </div>
                      <div className="pb-6 border-b border-white/60">
                        <p className="text-sm text-[#6F6C90]">
                          Present Complaints
                        </p>
                        {editMode ? (
                          <textarea
                            name="presentComplaints"
                            value={editData?.presentComplaints || ""}
                            onChange={handleEditChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] bg-white/80 resize-vertical"
                          />
                        ) : (
                          <p className="text-lg text-[#170F49] font-medium leading-relaxed">
                            {student?.presentComplaints || "N/A"}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-[#6F6C90]">
                          Previous Consultation and Treatments
                        </p>
                        {editMode ? (
                          <textarea
                            name="previousTreatments"
                            value={editData?.previousTreatments || ""}
                            onChange={handleEditChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E38B52] bg-white/80 resize-vertical"
                          />
                        ) : (
                          <p className="text-lg text-[#170F49] font-medium leading-relaxed">
                            {student?.previousTreatments || "N/A"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Family History */}
                {activeCaseSection === "family" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Family History
                    </h2>
                    <div className="space-y-6">
                      {/* Household Composition */}
                      <div className="p-6 bg-white/50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                          Household Composition
                        </h3>
                        {editMode ? (
                          <div className="overflow-x-auto pb-2">
                            <table className="min-w-[980px] w-full table-fixed border border-[#E38B52]/20 rounded-xl backdrop-blur-xl overflow-hidden">
                              <colgroup>
                                <col className="w-[6%]" />
                                <col className="w-[19%]" />
                                <col className="w-[8%]" />
                                <col className="w-[17%]" />
                                <col className="w-[17%]" />
                                <col className="w-[14%]" />
                                <col className="w-[19%]" />
                                <col className="w-[4%]" />
                              </colgroup>
                              <thead>
                                <tr className="border-b border-[#E38B52]/20">
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    S.No
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    Name
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    Age
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    Education
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    Occupation
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    Health
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    Income
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {householdRows.map((row) => (
                                  <tr
                                    key={row.id}
                                    className="border-b border-[#E38B52]/10"
                                  >
                                    <td className="px-4 py-3 text-sm text-[#170F49]">
                                      {row.id}
                                    </td>
                                    <td className="px-4 py-3 min-w-0">
                                      <input
                                        type="text"
                                        value={row.name}
                                        onChange={(e) =>
                                          updateHouseholdRow(
                                            row.id,
                                            "name",
                                            e.target.value,
                                          )
                                        }
                                        className="block w-full min-w-0 px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl text-sm text-[#170F49] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                      />
                                    </td>
                                    <td className="px-4 py-3 min-w-0">
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="Age"
                                        value={row.age}
                                        onChange={(e) =>
                                          updateHouseholdRow(
                                            row.id,
                                            "age",
                                            e.target.value,
                                          )
                                        }
                                        className="block w-full min-w-0 px-2.5 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl text-sm text-[#170F49] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                      />
                                    </td>
                                    <td className="px-4 py-3 min-w-0">
                                      <input
                                        type="text"
                                        value={row.education}
                                        onChange={(e) =>
                                          updateHouseholdRow(
                                            row.id,
                                            "education",
                                            e.target.value,
                                          )
                                        }
                                        className="block w-full min-w-0 px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl text-sm text-[#170F49] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                      />
                                    </td>
                                    <td className="px-4 py-3 min-w-0">
                                      <input
                                        type="text"
                                        value={row.occupation}
                                        onChange={(e) =>
                                          updateHouseholdRow(
                                            row.id,
                                            "occupation",
                                            e.target.value,
                                          )
                                        }
                                        className="block w-full min-w-0 px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl text-sm text-[#170F49] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                      />
                                    </td>
                                    <td className="px-4 py-3 min-w-0">
                                      <input
                                        type="text"
                                        value={row.health}
                                        onChange={(e) =>
                                          updateHouseholdRow(
                                            row.id,
                                            "health",
                                            e.target.value,
                                          )
                                        }
                                        className="block w-full min-w-0 px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl text-sm text-[#170F49] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                      />
                                    </td>
                                    <td className="px-4 py-3 min-w-0">
                                      <input
                                        type="text"
                                        value={row.income}
                                        onChange={(e) =>
                                          updateHouseholdRow(
                                            row.id,
                                            "income",
                                            e.target.value,
                                          )
                                        }
                                        className="block w-full min-w-0 px-4 py-2.5 bg-white/50 border border-[#E38B52]/20 rounded-xl text-sm text-[#170F49] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                      />
                                    </td>
                                    <td className="px-2 py-3 text-center align-middle">
                                      <button
                                        type="button"
                                        onClick={() => removeHouseholdRow(row.id)}
                                        disabled={householdRows.length === 1}
                                        aria-label="Delete household row"
                                        title="Delete row"
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 shadow-sm transition-all duration-200 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        <span className="text-base leading-none">Ãƒâ€”</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="mt-2 px-1 text-xs text-[#6F6C90] italic">
                              Scroll horizontally to view all household columns.
                            </div>
                            <button
                              type="button"
                              onClick={addHouseholdRow}
                              className="mt-4 w-full px-4 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B40] transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
                            >
                              Add Row
                            </button>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse rounded-xl overflow-hidden">
                              <thead className="bg-[#E38B52]/10">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    S.No
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    Name
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    Age
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    Education
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    Occupation
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    Health
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                    Income
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white/70">
                                {student?.household && student.household.length > 0 ? (
                                  student.household.map((member, index) => (
                                    <tr
                                      key={index}
                                      className="border-b border-[#E38B52]/10 last:border-b-0"
                                    >
                                      <td className="px-4 py-3 text-sm text-[#170F49]">
                                        {index + 1}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-[#170F49]">
                                        {member.name || "N/A"}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-[#170F49]">
                                        {member.age || "N/A"}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-[#170F49]">
                                        {member.education || "N/A"}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-[#170F49]">
                                        {member.occupation || "N/A"}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-[#170F49]">
                                        {member.health || "N/A"}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-[#170F49]">
                                        {member.income || "N/A"}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan="7"
                                      className="px-4 py-8 text-sm text-[#6F6C90] text-center"
                                    >
                                      No household composition data available
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Medical History */}
                      <div className="p-6 bg-white/50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                          Medical History
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Family History of Mental Illness
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="familyHistory.mental_illness"
                                value={
                                  editData?.familyHistory?.mental_illness || ""
                                }
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.familyHistory?.mental_illness ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Family History of Mental Retardation
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="familyHistory.mental_retardation"
                                value={
                                  editData?.familyHistory?.mental_retardation ||
                                  ""
                                }
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.familyHistory?.mental_retardation ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Family History of Epilepsy and Others
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="familyHistory.epilepsy"
                                value={editData?.familyHistory?.epilepsy || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.familyHistory?.epilepsy || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Birth History */}
                      <div className="p-6 bg-white/50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                          Birth History
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Prenatal History
                            </p>
                            {editMode ? (
                              <textarea
                                name="birthHistory.prenatal"
                                value={editData?.birthHistory?.prenatal || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                                rows="3"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.birthHistory?.prenatal || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Natal and Neonatal
                            </p>
                            {editMode ? (
                              <textarea
                                name="birthHistory.natal"
                                value={editData?.birthHistory?.natal || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                                rows="3"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.birthHistory?.natal || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Postnatal History
                            </p>
                            {editMode ? (
                              <textarea
                                name="birthHistory.postnatal"
                                value={editData?.birthHistory?.postnatal || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                                rows="3"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.birthHistory?.postnatal || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Developmental History */}
                {activeCaseSection === "development" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                      Development History
                    </h2>
                    <div className="p-6 bg-white/50 rounded-2xl mt-6">
                      <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                        Developmental History
                      </h3>
                      {editMode ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-xl shadow-lg">
                          {Object.entries(developmentHistoryMap).map(
                            ([label, field]) => (
                              <label
                                key={field}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-gray-300 text-[#E38B52] focus:ring-[#E38B52]"
                                  name={`developmentHistory.${field}`}
                                  checked={
                                    !!editData?.developmentHistory?.[field]
                                  }
                                  onChange={handleEditChange}
                                />
                                <span className="text-sm text-[#170F49]">
                                  {label}
                                </span>
                              </label>
                            ),
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 p-4 bg-white/70 rounded-xl">
                          {/* Check if developmentHistory exists and has entries */}
                          {student?.developmentHistory &&
                          Object.keys(student.developmentHistory).length > 0 ? (
                            Object.entries(developmentHistoryMap).map(
                              ([label, field]) => {
                                const value = student.developmentHistory[field];

                                return (
                                  <div key={field} className="flex items-center">
                                    {/* Display a green check for true, red cross for false */}
                                    {value ? (
                                      <span className="text-green-500 font-bold mr-2 text-xl">
                                        ✓
                                      </span>
                                    ) : (
                                      <span className="text-red-500 font-bold mr-2 text-xl">
                                        X
                                      </span>
                                    )}
                                    {/* Format the label from snake_case to Title Case */}
                                    <p className="text-[#170F49] font-medium capitalize">
                                      {label}
                                    </p>
                                  </div>
                                );
                              },
                            )
                          ) : (
                            <p className="col-span-full text-center text-[#6F6C90]">
                              No development history recorded.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Additional Information Section */}
                    <div className="mt-6">
                      <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 mr-2 text-[#E38B52]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Additional Information
                      </h2>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/50 rounded-2xl p-6 shadow-sm min-h-[120px]">
                              <h3 className="text-md font-semibold text-[#170F49] mb-2 capitalize">
                                School History
                              </h3>
                              {editMode ? (
                                <textarea
                                  name="additionalInfo.school_history"
                                  value={
                                    editData?.additionalInfo?.school_history || ""
                                  }
                                  onChange={handleEditChange}
                                  rows="4"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                                  placeholder="Enter school history"
                                />
                              ) : (
                                <p className="text-[#170F49] text-base leading-relaxed">
                                  {student?.additionalInfo?.school_history || "N/A"}
                                </p>
                              )}
                            </div>

                            <div className="bg-white/50 rounded-2xl p-6 shadow-sm min-h-[120px]">
                              <h3 className="text-md font-semibold text-[#170F49] mb-2 capitalize">
                                Occupational History
                              </h3>
                              {editMode ? (
                                <textarea
                                  name="additionalInfo.occupational_history"
                                  value={
                                    editData?.additionalInfo?.occupational_history ||
                                    ""
                                  }
                                  onChange={handleEditChange}
                                  rows="4"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                                  placeholder="Enter occupational history"
                                />
                              ) : (
                                <p className="text-[#170F49] text-base leading-relaxed">
                                  {student?.additionalInfo?.occupational_history ||
                                    "N/A"}
                                </p>
                              )}
                            </div>

                            <div className="md:col-span-2 bg-white/50 rounded-2xl p-6 shadow-sm min-h-[120px]">
                              <h3 className="text-md font-semibold text-[#170F49] mb-2 capitalize">
                                Behaviour Problems
                              </h3>
                              {editMode ? (
                                <textarea
                                  name="assessment.behaviour_problems"
                                  value={
                                    editData?.assessment?.behaviour_problems || ""
                                  }
                                  onChange={handleEditChange}
                                  rows="4"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300 resize-none"
                                  placeholder="Describe behaviour problems"
                                />
                              ) : (
                                <p className="text-[#170F49] text-base leading-relaxed">
                                  {student?.assessment?.behaviour_problems ||
                                    student?.additionalInfo?.behaviour_problems ||
                                    "N/A"}
                                </p>
                              )}
                            </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Education Assessment Section */}
                {activeCaseSection === "education" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h2"
                        />
                      </svg>
                      Special Education Assessment
                    </h2>

                    {/* Horizontal Navigation for Subsections */}
                    <div className="mb-8 overflow-x-auto">
                      <div className="flex gap-1 min-w-max pb-2">
                        {[
                          { id: "self-help", label: "Self Help" },
                          { id: "motor", label: "Motor" },
                          { id: "sensory", label: "Sensory" },
                          { id: "socialization", label: "Socialization" },
                          { id: "cognitive", label: "Cognitive" },
                          { id: "academic", label: "Academic" },
                          { id: "prevocational", label: "Prevocational" },
                          { id: "other-info", label: "Other Info" },
                        ].map((subsection) => (
                          <button
                            key={subsection.id}
                            onClick={() =>
                              setActiveEducationSubsection(subsection.id)
                            }
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                              activeEducationSubsection === subsection.id
                                ? "bg-[#E38B52] text-white shadow-lg"
                                : "bg-white/50 text-[#170F49] hover:bg-white/80"
                            }`}
                          >
                            {subsection.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Self Help */}
                    {activeEducationSubsection === "self-help" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">
                          Self Help
                        </h3>

                        {/* Food Habits */}
                        <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                          <h4 className="text-md font-medium text-[#170F49]">
                            Food Habits
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Eating
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.self_help.food_habits.eating"
                                  value={
                                    editData?.assessment?.self_help?.food_habits
                                      ?.eating || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe eating habits and capabilities"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.self_help?.food_habits
                                    ?.eating || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Drinking
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.self_help.food_habits.drinking"
                                  value={
                                    editData?.assessment?.self_help?.food_habits
                                      ?.drinking || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe drinking habits and capabilities"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.self_help?.food_habits
                                    ?.drinking || "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Toilet Habits (Include mention hygenic where
                              applicable)
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.self_help.toilet_habits"
                                value={
                                  editData?.assessment?.self_help
                                    ?.toilet_habits || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe toilet habits and hygiene practices"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.self_help
                                  ?.toilet_habits || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Brushing
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.self_help.brushing"
                                value={
                                  editData?.assessment?.self_help?.brushing ||
                                  ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe brushing capabilities and routine"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.self_help?.brushing ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Bathing
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.self_help.bathing"
                                value={
                                  editData?.assessment?.self_help?.bathing || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe bathing capabilities and habits"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.self_help?.bathing ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Dressing */}
                        <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-6">
                          <h4 className="text-md font-medium text-[#170F49]">
                            Dressing
                          </h4>
                          <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Removing and wearing clothes
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.self_help.dressing.removing_and_wearing"
                                  value={
                                    editData?.assessment?.self_help?.dressing
                                      ?.removing_and_wearing || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe ability to remove and wear clothes independently"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.self_help?.dressing
                                    ?.removing_and_wearing || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Unbuttoning and Buttoning
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.self_help.dressing.buttoning"
                                  value={
                                    editData?.assessment?.self_help?.dressing
                                      ?.buttoning || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe ability to handle buttons independently"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.self_help?.dressing
                                    ?.buttoning || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                wearing shoes/Slippers
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.self_help.dressing.footwear"
                                  value={
                                    editData?.assessment?.self_help?.dressing
                                      ?.footwear || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe ability to wear footwear independently"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.self_help?.dressing
                                    ?.footwear || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Grooming (include shaving skills where
                                applicable)
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.self_help.dressing.grooming"
                                  value={
                                    editData?.assessment?.self_help?.dressing
                                      ?.grooming || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe grooming abilities including shaving if applicable"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.self_help?.dressing
                                    ?.grooming || "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Motor */}
                    {activeEducationSubsection === "motor" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">
                          Motor
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-xl p-6 shadow-lg">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Gross Motor
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.motor.gross_motor"
                                value={editData?.assessment?.motor?.gross_motor || ""}
                                onChange={handleEditChange}
                                placeholder="Describe capabilities in large movements, balance, and coordination"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.motor?.gross_motor || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Fine Motor
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.motor.fine_motor"
                                value={editData?.assessment?.motor?.fine_motor || ""}
                                onChange={handleEditChange}
                                placeholder="Describe capabilities in small, precise movements"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.motor?.fine_motor || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Sensory */}
                    {activeEducationSubsection === "sensory" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">
                          Sensory
                        </h3>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                          {editMode ? (
                            <input
                              type="text"
                              name="assessment.sensory"
                              value={editData?.assessment?.sensory || ""}
                              onChange={handleEditChange}
                              placeholder="Describe sensory responses and processing capabilities"
                              className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.assessment?.sensory || "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Socialization */}
                    {activeEducationSubsection === "socialization" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#6366f1]/10">
                          Socialization
                        </h3>
                        <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Language/Communication
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.socialization.language_communication"
                                value={
                                  editData?.assessment?.socialization
                                    ?.language_communication || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe communication abilities and language skills"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.socialization
                                  ?.language_communication || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Social behaviour
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.socialization.social_behaviour"
                                value={
                                  editData?.assessment?.socialization
                                    ?.social_behaviour || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe interactions with others and social adaptability"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.socialization
                                  ?.social_behaviour || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Mobility in the nieghborhood
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.socialization.mobility"
                                value={
                                  editData?.assessment?.socialization
                                    ?.mobility || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe ability to navigate and move around in familiar areas"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.socialization?.mobility ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cognitive */}
                    {activeEducationSubsection === "cognitive" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#6366f1]/10">
                          Cognitive
                        </h3>
                        <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Attention
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.cognitive.attention"
                                value={
                                  editData?.assessment?.cognitive?.attention ||
                                  ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe attention span and focus capabilities"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.cognitive?.attention ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Identification of familiar objects
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.cognitive.identification_of_objects"
                                value={
                                  editData?.assessment?.cognitive
                                    ?.identification_of_objects || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe ability to recognize and name common objects"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.cognitive
                                  ?.identification_of_objects || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Use of familiar objects
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.cognitive.use_of_objects"
                                value={
                                  editData?.assessment?.cognitive
                                    ?.use_of_objects || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe ability to appropriately use common objects"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.cognitive
                                  ?.use_of_objects || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Following simple instruction
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.cognitive.following_instruction"
                                value={
                                  editData?.assessment?.cognitive
                                    ?.following_instruction || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe ability to understand and follow basic instructions"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.cognitive
                                  ?.following_instruction || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Awareness of dangrer and hazards
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.cognitive.awareness_of_danger"
                                value={
                                  editData?.assessment?.cognitive
                                    ?.awareness_of_danger || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe understanding of dangerous situations"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.cognitive
                                  ?.awareness_of_danger || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Concept Formation */}
                        <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-6">
                          <h4 className="text-md font-medium text-[#170F49]">
                            Concept formation (Indicate ability to match,
                            identify name wherever applicable)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Color
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.color"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.color || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe ability to recognize and match colors"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.color || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Size
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.size"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.size || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe understanding of size concepts"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.size || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Sex
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.sex"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.sex || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe understanding of gender concepts"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.sex || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Shape
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.shape"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.shape || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe ability to recognize and name shapes"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.shape || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Number
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.number"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.number || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe understanding of numbers and counting"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.number || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Time
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.time"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.time || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe understanding of time concepts"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.time || "N/A"}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Money
                              </label>
                              {editMode ? (
                                <input
                                  type="text"
                                  name="assessment.cognitive.concept_formation.money"
                                  value={
                                    editData?.assessment?.cognitive
                                      ?.concept_formation?.money || ""
                                  }
                                  onChange={handleEditChange}
                                  placeholder="Describe understanding of money concepts"
                                  className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                />
                              ) : (
                                <p className="text-[#170F49] font-medium">
                                  {student?.assessment?.cognitive
                                    ?.concept_formation?.money || "N/A"}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Academic */}
                    {activeEducationSubsection === "academic" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#6366f1]/10">
                          Academic (give brief history: class attended/attending
                          indicate class/grade/level wherever appropriate)
                        </h3>
                        <div className="bg-white rounded-xl p-6 space-y-6 shadow-lg">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Reading
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.academic.reading"
                                value={
                                  editData?.assessment?.academic?.reading || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe reading level and comprehension"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.academic?.reading ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Writing
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.academic.writing"
                                value={
                                  editData?.assessment?.academic?.writing || ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe writing abilities and skills"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.academic?.writing ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Arithmetic
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.academic.arithmetic"
                                value={
                                  editData?.assessment?.academic?.arithmetic ||
                                  ""
                                }
                                onChange={handleEditChange}
                                placeholder="Describe mathematical understanding and abilities"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.academic?.arithmetic ||
                                  "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Prevocational/Domestic */}
                    {activeEducationSubsection === "prevocational" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-8 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">
                          Prevocational/Domestic (Specify ability and interest)
                        </h3>
                        <div className="bg-white rounded-xl p-6 shadow-lg">
                          {editMode ? (
                            <input
                              type="text"
                              name="assessment.prevocational.ability_and_interest"
                              value={
                                editData?.assessment?.prevocational
                                  ?.ability_and_interest || ""
                              }
                              onChange={handleEditChange}
                              placeholder="Describe prevocational skills and domestic abilities"
                              className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                            />
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.assessment?.prevocational
                                ?.ability_and_interest || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Items of interest
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.prevocational.items_of_interest"
                                value={
                                  editData?.assessment?.prevocational
                                    ?.items_of_interest || ""
                                }
                                onChange={handleEditChange}
                                placeholder="List activities and objects that interest the student"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.prevocational
                                  ?.items_of_interest || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#170F49] mb-2">
                              Items of dislike
                            </label>
                            {editMode ? (
                              <input
                                type="text"
                                name="assessment.prevocational.items_of_dislike"
                                value={
                                  editData?.assessment?.prevocational
                                    ?.items_of_dislike || ""
                                }
                                onChange={handleEditChange}
                                placeholder="List activities and objects that the student dislikes"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.assessment?.prevocational
                                  ?.items_of_dislike || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Other Info */}
                    {activeEducationSubsection === "other-info" && (
                      <div className="bg-white/30 backdrop-blur-xl rounded-2xl p-6 space-y-6 mb-8">
                        <h3 className="text-lg font-semibold text-[#170F49] pb-2 border-b border-[#E38B52]/10">
                          Additional Information
                        </h3>
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">
                            Any peculiar behaviour/behaviour problems observed
                          </label>
                          {editMode ? (
                            <textarea
                              name="assessment.behaviour_problems"
                              value={
                                editData?.assessment?.behaviour_problems || ""
                              }
                              onChange={handleEditChange}
                              className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              rows="4"
                              placeholder="Describe any unusual behaviors or behavioral concerns observed"
                            ></textarea>
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.assessment?.behaviour_problems || "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">
                            Any other
                          </label>
                          {editMode ? (
                            <textarea
                              name="assessment.any_other"
                              value={editData?.assessment?.any_other || ""}
                              onChange={handleEditChange}
                              className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              rows="4"
                              placeholder="Add any additional observations or comments"
                            ></textarea>
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.assessment?.any_other ?? student?.any_other ?? "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#170F49] mb-2">
                            Recommendation
                          </label>
                          {editMode ? (
                            <textarea
                              name="assessment.recommendation"
                              value={editData?.assessment?.recommendation || ""}
                              onChange={handleEditChange}
                              className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              rows="4"
                              placeholder="Provide detailed recommendations for support and intervention"
                            ></textarea>
                          ) : (
                            <p className="text-[#170F49] font-medium">
                              {student?.assessment?.recommendation ?? student?.recommendation ?? "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Medical Information */}
                {activeCaseSection === "medical" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                      Medical Information
                    </h2>
                    <div className="space-y-6">
                      {/* Medical Status */}
                      <div className="p-6 bg-white/50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                          Medical Status
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Specific Diagnostic
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="specific_diagnostic"
                                value={editData?.specific_diagnostic || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.specific_diagnostic || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Medical Conditions
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="medical_conditions"
                                value={editData?.medical_conditions || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                                placeholder="Comma-separated"
                              />
                            ) : (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {(student?.medical_conditions || "")
                                  .toString()
                                  .split(",")
                                  .filter(Boolean)
                                  .map((c, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 bg-white/70 rounded-full text-sm text-[#170F49]"
                                    >
                                      {c.trim()}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Drug History */}
                      <div className="p-6 bg-white/50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                          Drug History
                        </h3>
                        {editMode ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-[#170F49] mb-2">
                                Is the child on regular drugs
                              </label>
                              <input
                                type="text"
                                name="is_on_regular_drugs"
                                value={editData?.is_on_regular_drugs || ""}
                                onChange={handleEditChange}
                                placeholder="Yes / No or details"
                                className="w-full px-4 py-3 rounded-xl border bg-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                              />
                            </div>
                            <div className="overflow-hidden">
                              <table className="w-full border border-[#E38B52]/20 rounded-xl backdrop-blur-xl overflow-hidden">
                                <thead>
                                  <tr className="border-b border-[#E38B52]/20">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                      S.No
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                      Name of drug
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                      Dose if known
                                    </th>
                                    <th className="px-2 py-3 text-center text-sm font-semibold text-[#170F49] w-14"></th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white/70">
                                  {drugRows.map((row) => (
                                    <tr
                                      key={row.id}
                                      className="border-b border-[#E38B52]/10 last:border-b-0"
                                    >
                                      <td className="px-4 py-3 text-sm text-[#170F49] align-middle">
                                        {row.id}
                                      </td>
                                      <td className="px-4 py-3 align-middle">
                                        <input
                                          type="text"
                                          value={row.name}
                                          onChange={(e) =>
                                            updateDrugRow(
                                              row.id,
                                              "name",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full min-w-0 px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl text-sm text-[#170F49] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                          placeholder="Enter drug name"
                                        />
                                      </td>
                                      <td className="px-4 py-3 align-middle">
                                        <input
                                          type="text"
                                          value={row.dose}
                                          onChange={(e) =>
                                            updateDrugRow(
                                              row.id,
                                              "dose",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full min-w-0 px-3 py-2 bg-white/50 border border-[#E38B52]/20 rounded-xl text-sm text-[#170F49] shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#E38B52] transition-all duration-300"
                                          placeholder="Enter dose"
                                        />
                                      </td>
                                      <td className="px-2 py-3 text-center align-middle">
                                        <button
                                          type="button"
                                          onClick={() => removeDrugRow(row.id)}
                                          disabled={drugRows.length === 1}
                                          aria-label="Delete drug row"
                                          title="Delete row"
                                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 shadow-sm transition-all duration-200 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                          <span className="text-base leading-none">Ãƒâ€”</span>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <button
                                type="button"
                                onClick={addDrugRow}
                                className="mt-4 w-full px-4 py-3 bg-[#E38B52] text-white rounded-xl hover:bg-[#E38B40] transition-all duration-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
                              >
                                Add Drug
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-[#6F6C90] mb-2">
                              Is the child on regular drugs
                            </p>
                            <p className="text-[#170F49] mb-4">
                              {student?.is_on_regular_drugs
                                ? student.is_on_regular_drugs
                                : "N/A"}
                            </p>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse rounded-xl overflow-hidden">
                                <thead className="bg-[#E38B52]/10">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                      S.No
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                      Name of drug
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#170F49]">
                                      Dose
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white/70">
                                  {(student?.drug_history || []).map((d, i) => (
                                    <tr
                                      key={i}
                                      className="border-b border-[#E38B52]/10"
                                    >
                                      <td className="px-4 py-3 text-sm text-[#170F49]">
                                        {i + 1}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-[#170F49]">
                                        {d?.name || "N/A"}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-[#170F49]">
                                        {d?.dose || "N/A"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Allergies */}
                      <div className="p-6 bg-white/50 rounded-2xl">
                        <h3 className="text-lg font-semibold text-[#170F49] mb-4">
                          Allergies
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Drug Allergy
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="drug_allergy"
                                value={editData?.drug_allergy || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.drug_allergy || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Food Allergy
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="food_allergy"
                                value={editData?.food_allergy || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.food_allergy || "N/A"}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-[#6F6C90]">
                              Other Allergies
                            </p>
                            {editMode ? (
                              <input
                                type="text"
                                name="allergies"
                                value={editData?.allergies || ""}
                                onChange={handleEditChange}
                                className="input-edit"
                              />
                            ) : (
                              <p className="text-[#170F49] font-medium">
                                {student?.allergies || "N/A"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                {activeCaseSection === "documents" && (
                  <div className="bg-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/20">
                    <h2 className="text-2xl font-bold text-[#170F49] mb-6 pb-4 border-b border-[#E38B52]/20 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-2 text-[#E38B52]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Documents
                    </h2>
                    <div className="p-6 bg-white/50 rounded-2xl">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/70 rounded-xl">
                          <div className="flex items-center gap-3">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#E38B52"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <line x1="10" y1="9" x2="8" y2="9" />
                            </svg>
                            <div>
                              <p className="font-medium text-[#170F49]">
                                Medical Assessment Report
                              </p>
                              <p className="text-sm text-[#6F6C90]">
                                Updated on: 10 Jan 2024
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/70 rounded-xl">
                          <div className="flex items-center gap-3">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#E38B52"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <line x1="10" y1="9" x2="8" y2="9" />
                            </svg>
                            <div>
                              <p className="font-medium text-[#170F49]">
                                Disability Certificate
                              </p>
                              <p className="text-sm text-[#6F6C90]">
                                Updated on: 5 Dec 2023
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200">
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons with adjusted margin */}
          <div className="flex gap-4 mt-6 md:mt-8">
            {editMode ? (
              <>
                <button
                  className="flex-1 bg-gray-300 py-4 rounded-2xl font-medium"
                  onClick={handleEditCancel}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 bg-[#E38B52] text-white py-4 rounded-2xl font-medium"
                  onClick={handleEditSave}
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                {activeTab === "student-details" && (
                  <>
                    <button
                      className="flex-1 bg-[#E38B52] text-white py-4 rounded-2xl hover:bg-[#E38B52]/90 hover:-translate-y-1 transition-all duration-200 font-medium shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_4px_8px_rgba(255,255,255,0.2)]"
                      onClick={handleEditStart}
                    >
                      Edit Details
                    </button>
                    <button
                      className="flex-1 bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-3 border border-white/20 hover:-translate-y-1 transition-all font-medium duration-200"
                      onClick={handleDownloadProfile}
                    >
                      Download Profile
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(100px, -100px) scale(1.2);
          }
          50% {
            transform: translate(0, 100px) scale(0.9);
          }
          75% {
            transform: translate(-100px, -50px) scale(1.1);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        @keyframes slide-in-right {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-float {
          animation: float 15s infinite ease-in-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .animation-delay-3000 {
          animation-delay: -5s;
        }
        .animation-delay-5000 {
          animation-delay: -10s;
        }
        .animation-delay-7000 {
          animation-delay: -15s;
        }

        @keyframes float-particle {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(var(--tx), var(--ty)) scale(0.8);
          }
        }

        .particle-1,
        .particle-2,
        .particle-3 {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          pointer-events: none;
        }

        .particle-1 {
          top: 20%;
          left: 20%;
          --tx: 10px;
          --ty: -10px;
          animation: float-particle 3s infinite ease-in-out;
        }

        .particle-2 {
          top: 50%;
          right: 20%;
          --tx: -15px;
          --ty: 5px;
          animation: float-particle 4s infinite ease-in-out;
        }

        .particle-3 {
          bottom: 20%;
          left: 50%;
          --tx: 5px;
          --ty: 15px;
          animation: float-particle 5s infinite ease-in-out;
        }
      `}</style>
      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-[#170F49] mb-2">
              {student?.name || "Student"}
            </h2>
            <p className="text-sm text-[#6F6C90] mb-6">
              {fromDate || "Any time"}  {toDate || "Any time"}
            </p>
            <div className="mb-4 text-sm text-[#333]">
              Showing {Math.min(reports.length, visibleCount)} of{" "}
              {reports.length} reports
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSummary(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-[#170F49]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Move the button component INSIDE the main div */}
      <DynamicScrollButtons />{" "}
    </div>
  );
};

export default StudentPage;














