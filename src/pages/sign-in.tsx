import {SignInCard} from "@/components/auth/sign-in-card.tsx";


export function SignInPage() {

  return (
    <div className="h-screen w-full flex flex-row justify-center items-center p-5">
      <img className="h-full w-full object-cover absolute -z-10" src="/signinphoto.jpg" alt="Photo of houses aranged in a hexagon with a blue sky in the middle" />
        <SignInCard />
    </div>
  )
}